<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ChangeMoneySubscriptionLifecycle;
use App\Actions\Money\SaveMoneySubscription;
use App\Actions\Money\SynchronizeMoneySubscriptions;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Data\Money\MoneySubscriptionData;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionRecurrence;
use App\Enums\MoneySubscriptionStatus;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MoneySubscriptionTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00 UTC');
    }

    public function test_definition_requires_owned_active_expense_selections_with_parent_scoping(): void
    {
        $user = $this->moneyUser();
        $other = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $foreignSubcategory = $this->moneySubcategory($this->moneyCategory($other));
        $income = $this->moneyCategory($user, MoneyCategoryType::Income);

        foreach ([
            [$this->moneyAccount($other)->id, $category->id, null, 'account_id'],
            [$account->id, $income->id, null, 'category_id'],
            [$account->id, $category->id, $foreignSubcategory->id, 'subcategory_id'],
        ] as [$accountId, $categoryId, $subcategoryId, $error]) {
            try {
                $this->saveDefinition($user, $accountId, $categoryId, $subcategoryId);
                $this->fail('Expected validation to fail.');
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey($error, $exception->errors());
            }
        }

        $account->update(['archived_at' => now()]);
        $this->expectException(ValidationException::class);
        $this->saveDefinition($user, $account->id, $category->id, null);
    }

    public function test_definition_edits_change_only_future_unresolved_occurrences(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $subscription = $this->moneySubscription($user, $account, $category, startsOn: '2026-06-18');
        $past = $subscription->occurrences()->whereDate('due_date', '2026-07-18')->firstOrFail();

        app(SaveMoneySubscription::class)->update($user, $subscription, new MoneySubscriptionData(
            name: 'Updated Internet',
            amountMinor: 2500,
            accountId: $account->id,
            categoryId: $category->id,
            subcategoryId: null,
            note: 'New plan',
            startsOn: CarbonImmutable::parse('2026-06-18'),
            endsOn: null,
            recurrence: MoneySubscriptionRecurrence::Monthly,
            paymentMode: MoneySubscriptionPaymentMode::Manual,
        ));

        $this->assertSame(1000, $past->refresh()->amount_minor);
        $this->assertSame(2500, $subscription->occurrences()->whereDate('due_date', '2026-09-18')->firstOrFail()->amount_minor);
    }

    public function test_pause_resume_end_and_unused_deletion_preserve_resolved_history(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $future = $this->moneySubscription($user, $account, $category, startsOn: '2026-09-01', name: 'Unused');
        app(ChangeMoneySubscriptionLifecycle::class)->deleteUnused($user, $future);
        $this->assertModelMissing($future);

        $subscription = $this->moneySubscription($user, $account, $category, startsOn: '2026-08-18');
        app(ChangeMoneySubscriptionLifecycle::class)->pause($user, $subscription);
        $this->assertSame(MoneySubscriptionStatus::Paused, $subscription->refresh()->status);

        CarbonImmutable::setTestNow('2026-10-18 10:00:00 UTC');
        app(ChangeMoneySubscriptionLifecycle::class)->resume($user, $subscription);
        $this->assertSame(['2026-08-18', '2026-10-18', '2026-11-18'], $subscription->occurrences()->orderBy('due_date')->pluck('due_date')->map(fn ($date) => CarbonImmutable::parse($date)->toDateString())->all());

        app(ChangeMoneySubscriptionLifecycle::class)->end($user, $subscription);
        $this->assertSame(MoneySubscriptionStatus::Ended, $subscription->refresh()->status);
        $this->assertTrue($subscription->occurrences()->whereDate('due_date', '2026-08-18')->exists());
        $this->assertFalse($subscription->occurrences()->whereDate('due_date', '2026-11-18')->exists());
    }

    public function test_repeated_synchronization_materializes_exactly_one_occurrence_per_due_date(): void
    {
        $user = $this->moneyUser();
        $subscription = $this->moneySubscription($user, $this->moneyAccount($user), $this->moneyCategory($user), startsOn: '2026-06-18');

        app(SynchronizeMoneySubscriptions::class)->execute($user);
        app(SynchronizeMoneySubscriptions::class)->execute($user);

        $this->assertSame(['2026-06-18', '2026-07-18', '2026-08-18', '2026-09-18'], $subscription->occurrences()->orderBy('due_date')->pluck('due_date')->map(fn ($date) => CarbonImmutable::parse($date)->toDateString())->all());
    }

    public function test_schedule_and_payment_mode_edits_do_not_reinterpret_past_due_occurrences(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $subscription = $this->moneySubscription($user, $account, $category, startsOn: '2026-06-18');

        app(SaveMoneySubscription::class)->update($user, $subscription, new MoneySubscriptionData(
            name: 'Internet', amountMinor: 1000, accountId: $account->id, categoryId: $category->id,
            subcategoryId: null, note: null, startsOn: CarbonImmutable::parse('2026-06-18'), endsOn: null,
            recurrence: MoneySubscriptionRecurrence::Weekly, paymentMode: MoneySubscriptionPaymentMode::Automatic,
        ));

        $this->assertSame(
            ['2026-06-18', '2026-07-18', '2026-08-18', '2026-08-20'],
            $subscription->occurrences()->orderBy('due_date')->pluck('due_date')->map(fn ($date) => CarbonImmutable::parse($date)->toDateString())->all(),
        );
        $this->assertSame(3, $subscription->occurrences()->where('payment_mode', 'manual')->count());
        $this->assertSame(1, $subscription->occurrences()->where('payment_mode', 'automatic')->count());
        $this->assertDatabaseCount('money_transactions', 0);
    }

    public function test_subscription_views_and_money_overview_expose_due_and_upcoming_snapshots(): void
    {
        $user = $this->moneyUser();
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::today())->update(['introduced_at' => now()]);
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $this->moneySubscription($user, $account, $category, startsOn: '2026-08-18');
        $user->moneySubscriptionOccurrences()->delete();

        $this->actingAs($user)->get('/money/subscriptions?view=due')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('money/subscriptions/Index')
            ->where('view', 'due')
            ->where('counts.due', 1)
            ->has('dueOccurrences', 1)
            ->where('dueOccurrences.0.overdue', false));

        $this->get('/money')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('money/Index')
            ->has('dueSubscriptions', 1)
            ->has('upcomingSubscriptions', 1));
    }

    public function test_cross_user_subscription_routes_are_forbidden(): void
    {
        $owner = $this->moneyUser();
        $subscription = $this->moneySubscription($owner, $this->moneyAccount($owner), $this->moneyCategory($owner));
        $occurrence = $subscription->occurrences()->whereDate('due_date', '2026-08-18')->firstOrFail();
        $intruder = $this->moneyUser();

        foreach ([
            ['post', "/money/subscriptions/{$subscription->id}/pause", []],
            ['post', "/money/subscriptions/{$subscription->id}/end", []],
            ['delete', "/money/subscriptions/{$subscription->id}", []],
            ['post', "/money/subscription-occurrences/{$occurrence->id}/skip", []],
        ] as [$method, $uri, $payload]) {
            $this->actingAs($intruder)->json(strtoupper($method), $uri, $payload)->assertForbidden();
        }
    }

    public function test_http_composer_and_pay_actions_create_the_linked_expense(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 5000);
        $category = $this->moneyCategory($user);

        $this->actingAs($user)->post('/money/subscriptions', [
            'name' => 'Phone plan',
            'amount' => '19.95',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'start_date' => '2026-08-18',
            'recurrence' => 'monthly',
            'payment_mode' => 'manual',
        ])->assertSessionHasNoErrors();

        $occurrence = $user->moneySubscriptionOccurrences()->whereDate('due_date', '2026-08-18')->firstOrFail();
        $this->post("/money/subscription-occurrences/{$occurrence->id}/pay", [
            'amount' => '21.00',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'apply_to_future' => true,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('money_transactions', [
            'user_id' => $user->id,
            'type' => 'expense',
            'amount_minor' => 2100,
            'account_id' => $account->id,
            'category_id' => $category->id,
        ]);
        $this->assertSame(2100, $occurrence->refresh()->amount_minor);
        $this->assertSame(2100, $occurrence->subscription->refresh()->amount_minor);
    }

    private function saveDefinition($user, int $accountId, int $categoryId, ?int $subcategoryId): void
    {
        app(SaveMoneySubscription::class)->create($user, new MoneySubscriptionData(
            name: 'Subscription', amountMinor: 1000, accountId: $accountId, categoryId: $categoryId,
            subcategoryId: $subcategoryId, note: null, startsOn: CarbonImmutable::today(), endsOn: null,
            recurrence: MoneySubscriptionRecurrence::Monthly, paymentMode: MoneySubscriptionPaymentMode::Manual,
        ));
    }
}
