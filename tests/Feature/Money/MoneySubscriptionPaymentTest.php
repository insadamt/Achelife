<?php

namespace Tests\Feature\Money;

use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\PayMoneySubscriptionOccurrence;
use App\Actions\Money\SkipMoneySubscriptionOccurrence;
use App\Actions\Money\SynchronizeMoneySubscriptions;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Data\Money\MoneySubscriptionPaymentData;
use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\SeasonRolloverPreference;
use App\Services\Money\AccountBalanceCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MoneySubscriptionPaymentTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00 UTC');
    }

    public function test_automatic_synchronization_catches_up_with_ordinary_expenses_exactly_once(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 10000);
        $category = $this->moneyCategory($user);
        $subscription = $this->moneySubscription(
            $user,
            $account,
            $category,
            amountMinor: 1200,
            startsOn: '2026-05-18',
            paymentMode: MoneySubscriptionPaymentMode::Automatic,
        );

        app(SynchronizeMoneySubscriptions::class)->execute($user);

        $this->assertSame(4, $subscription->occurrences()->where('status', MoneySubscriptionOccurrenceStatus::Paid)->count());
        $this->assertSame(4, $user->moneyTransactions()->where('type', 'expense')->count());
        $this->assertSame(5200, $this->balance($user, $account));
        $this->assertSame(1, $subscription->occurrences()->whereDate('due_date', '2026-09-18')->where('status', 'due')->count());
    }

    public function test_manual_payment_can_override_once_or_apply_values_to_future_payments(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $subscription = $this->moneySubscription($user, $account, $category, amountMinor: 1000);
        $occurrence = $subscription->occurrences()->whereDate('due_date', '2026-08-18')->firstOrFail();

        app(PayMoneySubscriptionOccurrence::class)->execute($user, $occurrence, new MoneySubscriptionPaymentData(
            amountMinor: 1350,
            accountId: $account->id,
            categoryId: $category->id,
            subcategoryId: null,
            note: 'One-time usage charge',
            applyToFuturePayments: false,
        ));

        $this->assertSame(1000, $subscription->refresh()->amount_minor);
        $this->assertSame(1000, $subscription->occurrences()->whereDate('due_date', '2026-09-18')->firstOrFail()->amount_minor);

        CarbonImmutable::setTestNow('2026-09-18 10:00:00 UTC');
        app(SynchronizeMoneySubscriptions::class)->execute($user);
        $future = $subscription->occurrences()->whereDate('due_date', '2026-09-18')->firstOrFail();
        app(PayMoneySubscriptionOccurrence::class)->execute($user, $future, new MoneySubscriptionPaymentData(
            amountMinor: 1500,
            accountId: $account->id,
            categoryId: $category->id,
            subcategoryId: null,
            note: 'New plan',
            applyToFuturePayments: true,
        ));

        $this->assertSame(1500, $subscription->refresh()->amount_minor);
        $this->assertSame(1500, $subscription->occurrences()->whereDate('due_date', '2026-10-18')->firstOrFail()->amount_minor);
        $this->assertSame(-2850, $this->balance($user, $account));
    }

    public function test_deleting_a_linked_expense_reverses_balance_and_returns_occurrence_to_due(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 5000);
        $category = $this->moneyCategory($user);
        $subscription = $this->moneySubscription($user, $account, $category, amountMinor: 1250);
        $occurrence = $subscription->occurrences()->whereDate('due_date', '2026-08-18')->firstOrFail();
        $transaction = app(PayMoneySubscriptionOccurrence::class)->execute($user, $occurrence, $this->payment($occurrence));

        app(DeleteMoneyTransaction::class)->execute($transaction);

        $this->assertSame(5000, $this->balance($user, $account));
        $this->assertSame(MoneySubscriptionOccurrenceStatus::Due, $occurrence->refresh()->status);
        $this->assertNull($occurrence->transaction_id);
        $this->assertNull($occurrence->paid_at);
        $this->assertNotNull($occurrence->automatic_retry_blocked_at);

        app(SynchronizeMoneySubscriptions::class)->execute($user);
        $this->assertSame(MoneySubscriptionOccurrenceStatus::Due, $occurrence->refresh()->status);
        $this->assertDatabaseMissing('money_transactions', ['id' => $transaction->id]);
    }

    public function test_manual_occurrence_can_be_skipped_but_not_paid_or_skipped_twice(): void
    {
        $user = $this->moneyUser();
        $subscription = $this->moneySubscription($user, $this->moneyAccount($user), $this->moneyCategory($user));
        $occurrence = $subscription->occurrences()->whereDate('due_date', '2026-08-18')->firstOrFail();

        app(SkipMoneySubscriptionOccurrence::class)->execute($user, $occurrence);

        $this->assertSame(MoneySubscriptionOccurrenceStatus::Skipped, $occurrence->refresh()->status);
        $this->expectException(ValidationException::class);
        app(SkipMoneySubscriptionOccurrence::class)->execute($user, $occurrence);
    }

    public function test_unique_constraints_prevent_duplicate_due_dates_and_transaction_links(): void
    {
        $user = $this->moneyUser();
        $subscription = $this->moneySubscription($user, $this->moneyAccount($user), $this->moneyCategory($user));
        $occurrence = $subscription->occurrences()->whereDate('due_date', '2026-08-18')->firstOrFail();

        $this->expectException(QueryException::class);
        $user->moneySubscriptionOccurrences()->create([
            'subscription_id' => $subscription->id,
            'due_date' => $occurrence->due_date,
            'amount_minor' => $occurrence->amount_minor,
            'account_id' => $occurrence->account_id,
            'category_id' => $occurrence->category_id,
            'payment_mode' => 'manual',
            'status' => 'due',
        ]);
    }

    public function test_due_date_decisions_use_each_users_local_date(): void
    {
        CarbonImmutable::setTestNow('2026-08-19 00:30:00 UTC');
        $losAngeles = $this->moneyUser();
        $losAngeles->update(['timezone' => 'America/Los_Angeles']);
        $tokyo = $this->moneyUser();
        $tokyo->update(['timezone' => 'Asia/Tokyo']);

        $laSubscription = $this->moneySubscription($losAngeles, $this->moneyAccount($losAngeles), $this->moneyCategory($losAngeles), startsOn: '2026-08-19');
        $tokyoSubscription = $this->moneySubscription($tokyo, $this->moneyAccount($tokyo), $this->moneyCategory($tokyo), startsOn: '2026-08-19');

        $this->assertSame(0, $laSubscription->occurrences()->whereDate('due_date', '<=', '2026-08-18')->count());
        $this->assertSame(1, $tokyoSubscription->occurrences()->whereDate('due_date', '<=', '2026-08-19')->count());
    }

    public function test_subscription_processing_continues_in_intermission_without_sp_or_rank_changes(): void
    {
        $user = $this->moneyUser('2026-01-01');
        $user->update(['season_rollover_preference' => SeasonRolloverPreference::Manual]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::today());
        $seasonSnapshot = $user->seasons()->get(['id', 'season_points', 'rank'])->toArray();
        $account = $this->moneyAccount($user);

        $this->moneySubscription(
            $user,
            $account,
            $this->moneyCategory($user),
            startsOn: '2026-08-18',
            paymentMode: MoneySubscriptionPaymentMode::Automatic,
        );

        $this->assertSame(-1000, $this->balance($user, $account));
        $this->assertSame($seasonSnapshot, $user->seasons()->get(['id', 'season_points', 'rank'])->toArray());
    }

    private function payment($occurrence): MoneySubscriptionPaymentData
    {
        return new MoneySubscriptionPaymentData(
            amountMinor: $occurrence->amount_minor,
            accountId: $occurrence->account_id,
            categoryId: $occurrence->category_id,
            subcategoryId: $occurrence->subcategory_id,
            note: $occurrence->note,
            applyToFuturePayments: false,
        );
    }

    private function balance($user, $account): int
    {
        return app(AccountBalanceCalculator::class)->forAccounts($user, collect([$account]))[$account->id];
    }
}
