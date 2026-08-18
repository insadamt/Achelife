<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ArchiveMoneyAccount;
use App\Actions\Money\DeleteUnusedMoneyAccount;
use App\Actions\Money\ReactivateMoneyAccount;
use App\Actions\Money\UpdateMoneyAccount;
use App\Enums\MoneyTransactionType;
use App\Services\Money\AccountBalanceCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class AccountLifecycleTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_account_creation_preserves_currency_and_signed_initial_balance(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, 'Overdraft', 'usd', -5000);

        $this->assertSame('USD', $account->currency);
        $this->assertSame(-5000, $this->balances($user, [$account])[$account->id]);
    }

    public function test_totals_are_grouped_by_currency_without_conversion(): void
    {
        $user = $this->moneyUser();
        $madOne = $this->moneyAccount($user, 'Cash', 'MAD', 50000);
        $madTwo = $this->moneyAccount($user, 'Bank', 'MAD', 300000);
        $usd = $this->moneyAccount($user, 'Wallet', 'USD', 20000);
        $accounts = collect([$madOne, $madTwo, $usd]);
        $calculator = app(AccountBalanceCalculator::class);

        $this->assertSame(['MAD' => 350000, 'USD' => 20000], $calculator->totalsByCurrency($accounts, $calculator->forAccounts($user, $accounts)));
    }

    public function test_unused_account_is_fully_editable_and_deletable(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        app(UpdateMoneyAccount::class)->execute($account, 'Wallet', 'EUR', 12500);

        $this->assertSame(['Wallet', 'EUR', 12500], [$account->refresh()->name, $account->currency, $account->initial_balance_minor]);
        app(DeleteUnusedMoneyAccount::class)->execute($account);
        $this->assertDatabaseMissing('money_accounts', ['id' => $account->id]);
    }

    public function test_used_account_locks_currency_and_initial_balance_but_allows_rename(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 10000);
        $category = $this->moneyCategory($user);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 1500, category: $category);
        app(UpdateMoneyAccount::class)->execute($account, 'Daily Cash', 'MAD', 10000);
        $this->assertSame('Daily Cash', $account->refresh()->name);

        foreach ([['USD', 10000], ['MAD', 11000]] as [$currency, $initial]) {
            try {
                app(UpdateMoneyAccount::class)->execute($account, 'Daily Cash', $currency, $initial);
                $this->fail('Used Account financial foundations must be immutable.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_used_account_cannot_be_deleted_and_can_be_archived_then_reactivated(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 100, category: $category);

        try {
            app(DeleteUnusedMoneyAccount::class)->execute($account);
            $this->fail('Used Accounts must not be deleted.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        app(ArchiveMoneyAccount::class)->execute($account);
        $this->assertNotNull($account->refresh()->archived_at);
        app(ReactivateMoneyAccount::class)->execute($account);
        $this->assertNull($account->refresh()->archived_at);
        $this->assertSame(-100, $this->balances($user, [$account])[$account->id]);
    }

    public function test_archived_account_is_unavailable_for_new_transactions(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        app(ArchiveMoneyAccount::class)->execute($account);

        $this->expectException(ValidationException::class);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 100, category: $category);
    }

    private function balances($user, array $accounts): array
    {
        return app(AccountBalanceCalculator::class)->forAccounts($user, collect($accounts));
    }
}
