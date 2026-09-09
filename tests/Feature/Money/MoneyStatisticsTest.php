<?php

namespace Tests\Feature\Money;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use App\Services\Money\MoneyStatistics;
use App\Support\Money\MoneyPresetPack;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MoneyStatisticsTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    public function test_month_includes_opening_balances_and_every_authoritative_spending_effect(): void
    {
        CarbonImmutable::setTestNow('2026-09-10 12:00:00');
        $user = $this->moneyUser('2026-07-01');
        $cash = $this->moneyAccount($user, 'Cash', 'MAD', 10000);
        $bank = $this->moneyAccount($user, 'Bank', 'MAD', 5000);
        $euro = $this->moneyAccount($user, 'Euro', 'EUR', 90000);
        $this->setAccountCreationDate($cash->id, '2026-09-02 10:00:00');
        $this->setAccountCreationDate($bank->id, '2026-08-05 10:00:00');
        $this->setAccountCreationDate($euro->id, '2026-09-01 10:00:00');
        $income = $this->moneyCategory($user, MoneyCategoryType::Income, 'Work');
        $expense = $this->moneyCategory($user, MoneyCategoryType::Expense, 'Food');
        $financial = $this->moneyCategory($user, MoneyCategoryType::Expense, 'Financial');
        $financial->update(['preset_key' => MoneyPresetPack::FINANCIAL_CATEGORY_KEY]);
        $bankFees = $this->moneySubcategory($financial, 'Bank Fees');
        $bankFees->update(['preset_key' => MoneyPresetPack::BANK_FEES_SUBCATEGORY_KEY]);
        $this->moneyTransaction($user, MoneyTransactionType::Income, $cash, 20000, category: $income, date: '2026-09-03');
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $cash, 5000, category: $expense, date: '2026-09-04');
        $this->moneyTransaction($user, MoneyTransactionType::Transfer, $cash, 2500, destination: $bank, date: '2026-09-05', feeMinor: 100);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $cash, 200, category: $financial, subcategory: $bankFees, date: '2026-09-06');
        $this->moneyTransaction($user, MoneyTransactionType::Income, $cash, 10000, category: $income, date: '2026-08-07');
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $cash, 4000, category: $expense, date: '2026-08-08');
        $this->moneyTransaction($user, MoneyTransactionType::Income, $euro, 80000, category: $income, date: '2026-09-03');

        $statistics = $this->statistics($user, 'month', currency: 'MAD');

        $this->assertSame(10000, $statistics['current']['openingBalanceMinor']);
        $this->assertSame(30000, $statistics['current']['totalIncomeMinor']);
        $this->assertSame(5300, $statistics['current']['spendingMinor']);
        $this->assertSame(24700, $statistics['current']['netCashFlowMinor']);
        $this->assertSame(82.3, $statistics['current']['savingsRate']);
        $this->assertSame(15000, $statistics['previous']['totalIncomeMinor']);
        $this->assertSame(4000, $statistics['previous']['spendingMinor']);
        $this->assertSame(100, $statistics['current']['transferFeesMinor']);
        $this->assertSame('Financial', $statistics['current']['spendingBreakdown'][1]['name']);
        $this->assertSame(300, $statistics['current']['spendingBreakdown'][1]['amountMinor']);
        $this->assertTrue($statistics['current']['spendingBreakdown'][1]['includesProjectedFees']);
        $this->assertSame(10000, $statistics['trend']['current'][1]['openingBalanceMinor']);
        $this->assertSame(4, $statistics['current']['transactionCount']);
    }

    public function test_account_scope_keeps_transfers_visible_without_treating_principal_as_income_or_spending(): void
    {
        CarbonImmutable::setTestNow('2026-09-10 12:00:00');
        $user = $this->moneyUser('2026-07-01');
        $cash = $this->moneyAccount($user, 'Cash', 'MAD');
        $bank = $this->moneyAccount($user, 'Bank', 'MAD');
        $this->setAccountCreationDate($cash->id, '2026-08-01 10:00:00');
        $this->setAccountCreationDate($bank->id, '2026-08-01 10:00:00');
        $this->moneyTransaction($user, MoneyTransactionType::Transfer, $cash, 2500, destination: $bank, date: '2026-09-05', feeMinor: 100);

        $source = $this->statistics($user, 'month', currency: 'MAD', accountId: $cash->id);
        $destination = $this->statistics($user, 'month', currency: 'MAD', accountId: $bank->id);

        $this->assertSame(100, $source['current']['spendingMinor']);
        $this->assertSame(2500, $source['current']['accounts'][0]['transferredOutMinor']);
        $this->assertSame(-2600, $source['current']['accounts'][0]['netMovementMinor']);
        $this->assertSame(0, $destination['current']['spendingMinor']);
        $this->assertSame(2500, $destination['current']['accounts'][0]['transferredInMinor']);
        $this->assertSame(2500, $destination['current']['accounts'][0]['netMovementMinor']);
    }

    public function test_opening_balance_uses_the_users_local_account_creation_date(): void
    {
        CarbonImmutable::setTestNow('2026-09-10 12:00:00');
        $user = $this->moneyUser('2026-07-01');
        $user->update(['timezone' => 'America/New_York']);
        $account = $this->moneyAccount($user, 'Cash', 'USD', 10000);
        $this->setAccountCreationDate($account->id, '2026-09-01 02:00:00');

        $statistics = $this->statistics($user, 'month', currency: 'USD');

        $this->assertSame(0, $statistics['current']['openingBalanceMinor']);
        $this->assertSame(10000, $statistics['previous']['openingBalanceMinor']);
    }

    public function test_statistics_page_defaults_to_month_and_validates_scope_filters(): void
    {
        CarbonImmutable::setTestNow('2026-09-10 12:00:00');
        $user = $this->moneyUser('2026-09-01');
        $account = $this->moneyAccount($user, 'Cash', 'MAD', 1000);
        $euroAccount = $this->moneyAccount($user, 'Euro', 'EUR');
        $income = $this->moneyCategory($user, MoneyCategoryType::Income, 'Work');
        $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 1000, category: $income, date: '2026-09-05');
        $this->moneyTransaction($user, MoneyTransactionType::Income, $euroAccount, 2000, category: $income, date: '2026-09-05');
        app(ResolveUserSeasonCycle::class)->execute($user)->activeSeason->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/money/statistics')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('money/Statistics')
            ->where('statistics.filter', 'month')
            ->where('statistics.currency', 'MAD')
            ->where('statistics.accountId', null));
        $this->get("/money/statistics?currency=MAD&account={$account->id}&statistics_period=all")->assertInertia(fn (Assert $page) => $page
            ->where('statistics.filter', 'all')
            ->where('statistics.accountId', $account->id)
            ->where('statistics.previous', null));
        $this->get('/money/statistics?currency=mad')->assertSessionHasErrors('currency');
        $this->get('/money/history?currency=MAD')->assertInertia(fn (Assert $page) => $page
            ->has('transactions.data', 1)
            ->where('transactions.data.0.account.currency', 'MAD'));
    }

    /** @return array<string, mixed> */
    private function statistics($user, string $filter, ?string $selection = null, ?string $currency = null, ?int $accountId = null): array
    {
        return app(MoneyStatistics::class)->summarize(
            $user,
            app(ResolveUserSeasonCycle::class)->execute($user),
            $filter,
            $selection,
            $currency,
            $accountId,
        );
    }

    private function setAccountCreationDate(int $accountId, string $createdAt): void
    {
        DB::table('money_accounts')->where('id', $accountId)->update(['created_at' => $createdAt]);
    }
}
