<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ArchiveMoneyMerchant;
use App\Actions\Money\DeleteUnusedMoneyMerchant;
use App\Actions\Money\ReactivateMoneyMerchant;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\MoneyTransactionType;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MerchantLifecycleTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-12 10:00:00');
    }

    public function test_merchants_can_be_created_renamed_and_listed_without_case_insensitive_duplicates(): void
    {
        $user = $this->moneyUser();
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-09-12'));
        $season->update(['introduced_at' => now()]);

        $this->actingAs($user)->post('/money/merchants', ['name' => '  Steam  '])
            ->assertRedirect()
            ->assertSessionHasNoErrors();
        $merchant = $user->moneyMerchants()->sole();
        $this->assertSame('Steam', $merchant->name);

        $this->post('/money/merchants', ['name' => 'steam'])
            ->assertSessionHasErrors('name');
        $this->put("/money/merchants/{$merchant->id}", ['name' => 'Steam Store'])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->get('/money/organization?section=merchants')->assertOk()->assertInertia(fn ($page) => $page
            ->component('money/organization/Index')
            ->where('initialSection', 'merchants')
            ->has('merchants', 1)
            ->where('merchants.0.name', 'Steam Store')
            ->where('merchants.0.archivedAt', null)
            ->where('merchants.0.hasHistory', false));
        $this->get('/money/merchants')->assertRedirect('/money/organization?section=merchants');
    }

    public function test_used_merchants_archive_without_breaking_history_and_require_reactivation_for_new_activity(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $this->actingAs($user)->post('/money/transactions', $this->transactionPayload($account->id, $category->id))
            ->assertSessionHasNoErrors();
        $transaction = $user->moneyTransactions()->sole();
        $merchant = $user->moneyMerchants()->sole();

        try {
            app(DeleteUnusedMoneyMerchant::class)->execute($merchant);
            $this->fail('A used Merchant must retain its historical relationship.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        app(ArchiveMoneyMerchant::class)->execute($merchant);
        $this->post('/money/transactions', $this->transactionPayload($account->id, $category->id))
            ->assertSessionHasErrors('merchant');
        $this->put("/money/transactions/{$transaction->id}", [
            ...$this->transactionPayload($account->id, $category->id),
            'amount' => '11.00',
        ])->assertSessionHasNoErrors();
        $this->assertSame($merchant->id, $transaction->refresh()->merchant_id);

        app(ReactivateMoneyMerchant::class)->execute($merchant);
        $this->post('/money/transactions', $this->transactionPayload($account->id, $category->id))
            ->assertSessionHasNoErrors();
        $this->assertDatabaseCount('money_merchants', 1);
    }

    public function test_unused_merchants_can_be_deleted_and_other_users_cannot_manage_them(): void
    {
        $owner = $this->moneyUser();
        $intruder = $this->moneyUser();
        $this->actingAs($owner)->post('/money/merchants', ['name' => 'Local Shop']);
        $merchant = $owner->moneyMerchants()->sole();

        $this->actingAs($intruder)->put("/money/merchants/{$merchant->id}", ['name' => 'Changed'])->assertForbidden();
        $this->actingAs($intruder)->post("/money/merchants/{$merchant->id}/archive")->assertForbidden();
        $this->actingAs($intruder)->delete("/money/merchants/{$merchant->id}")->assertForbidden();

        app(DeleteUnusedMoneyMerchant::class)->execute($merchant);
        $this->assertDatabaseMissing('money_merchants', ['id' => $merchant->id]);
    }

    /** @return array<string, mixed> */
    private function transactionPayload(int $accountId, int $categoryId): array
    {
        return [
            'type' => MoneyTransactionType::Expense->value,
            'amount' => '10.00',
            'account_id' => $accountId,
            'category_id' => $categoryId,
            'merchant' => 'Steam',
            'date' => '2026-09-12',
        ];
    }
}
