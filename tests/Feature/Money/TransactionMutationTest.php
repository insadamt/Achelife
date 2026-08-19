<?php

namespace Tests\Feature\Money;

use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\SaveMoneyTransaction;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use App\Services\Money\AccountBalanceCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class TransactionMutationTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_income_and_expense_apply_exact_effects_and_allow_negative_balances(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $income = $this->moneyCategory($user, MoneyCategoryType::Income, 'Salary');
        $expense = $this->moneyCategory($user);
        $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 200000, category: $income, note: 'August salary');
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 250000, category: $expense);

        $this->assertSame(-50000, $this->balance($user, $account));
        $this->assertSame('August salary', $user->moneyTransactions()->where('type', 'income')->first()->note);
    }

    public function test_local_today_is_accepted_before_utc_reaches_that_date(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-18 23:30:00', 'UTC'));
        $user = $this->moneyUser();
        $user->update(['timezone' => 'Asia/Dubai']);
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);

        $this->actingAs($user)->post('/money/transactions', [
            'type' => 'expense',
            'amount' => '10.00',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'date' => '2026-08-19',
        ])->assertRedirect();

        $this->assertDatabaseHas('money_transactions', [
            'user_id' => $user->id,
            'transaction_date' => '2026-08-19 00:00:00',
        ]);
    }

    public function test_editing_amount_and_account_recomputes_from_the_single_source_of_truth(): void
    {
        $user = $this->moneyUser();
        $cash = $this->moneyAccount($user, 'Cash');
        $bank = $this->moneyAccount($user, 'Bank');
        $category = $this->moneyCategory($user);
        $transaction = $this->moneyTransaction($user, MoneyTransactionType::Expense, $cash, 20000, category: $category);

        $updated = new MoneyTransactionData(MoneyTransactionType::Expense, 12000, $bank->id, null, $category->id, null, CarbonImmutable::parse('2026-08-17'), 'Corrected');
        app(SaveMoneyTransaction::class)->update($user, $transaction, $updated);

        $balances = app(AccountBalanceCalculator::class)->forAccounts($user, collect([$cash, $bank]));
        $this->assertSame(0, $balances[$cash->id]);
        $this->assertSame(-12000, $balances[$bank->id]);
    }

    public function test_deleting_income_or_expense_reverses_its_effect(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user, initialMinor: 10000);
        $category = $this->moneyCategory($user, MoneyCategoryType::Income, 'Gift');
        $transaction = $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 5000, category: $category);
        $this->assertSame(15000, $this->balance($user, $account));

        app(DeleteMoneyTransaction::class)->execute($transaction);
        $this->assertSame(10000, $this->balance($user, $account));
    }

    public function test_matching_currency_transfer_is_one_record_and_updates_both_accounts(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 100000);
        $cash = $this->moneyAccount($user, 'Cash');
        $transfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 30000, $cash, note: 'Cash top-up');
        $balances = app(AccountBalanceCalculator::class)->forAccounts($user, collect([$bank, $cash]));

        $this->assertSame(1, $user->moneyTransactions()->count());
        $this->assertSame([$bank->id, $cash->id], [$transfer->account_id, $transfer->destination_account_id]);
        $this->assertSame([70000, 30000], [$balances[$bank->id], $balances[$cash->id]]);
    }

    public function test_transfer_rejects_same_account_and_different_currencies_without_partial_mutation(): void
    {
        $user = $this->moneyUser();
        $mad = $this->moneyAccount($user, 'MAD', initialMinor: 10000);
        $usd = $this->moneyAccount($user, 'USD', 'USD', 5000);

        foreach ([$mad, $usd] as $destination) {
            try {
                $this->moneyTransaction($user, MoneyTransactionType::Transfer, $mad, 1000, $destination);
                $this->fail('Invalid transfer must fail.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        $this->assertSame(0, $user->moneyTransactions()->count());
        $this->assertSame([10000, 5000], [$this->balance($user, $mad), $this->balance($user, $usd)]);
    }

    public function test_failed_transfer_edit_preserves_the_complete_previous_effect(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 10000);
        $cash = $this->moneyAccount($user, 'Cash');
        $usd = $this->moneyAccount($user, 'USD Wallet', 'USD');
        $transfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 3000, $cash);
        $invalid = new MoneyTransactionData(MoneyTransactionType::Transfer, 5000, $bank->id, $usd->id, null, null, CarbonImmutable::parse('2026-08-18'), null);

        try {
            app(SaveMoneyTransaction::class)->update($user, $transfer, $invalid);
            $this->fail('The invalid edit must roll back.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        $this->assertSame([$bank->id, $cash->id, 3000], [
            $transfer->refresh()->account_id,
            $transfer->destination_account_id,
            $transfer->amount_minor,
        ]);
        $this->assertSame([7000, 3000, 0], [
            $this->balance($user, $bank),
            $this->balance($user, $cash),
            $this->balance($user, $usd),
        ]);
    }

    public function test_transfer_edit_moves_both_effects_atomically_and_delete_reverses_both(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 100000);
        $cash = $this->moneyAccount($user, 'Cash');
        $savings = $this->moneyAccount($user, 'Savings');
        $transfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 50000, $cash);
        $data = new MoneyTransactionData(MoneyTransactionType::Transfer, 30000, $cash->id, $savings->id, null, null, CarbonImmutable::parse('2026-08-17'), null);
        app(SaveMoneyTransaction::class)->update($user, $transfer, $data);
        $balances = app(AccountBalanceCalculator::class)->forAccounts($user, collect([$bank, $cash, $savings]));
        $this->assertSame([100000, -30000, 30000], [$balances[$bank->id], $balances[$cash->id], $balances[$savings->id]]);

        app(DeleteMoneyTransaction::class)->execute($transfer);
        $balances = app(AccountBalanceCalculator::class)->forAccounts($user, collect([$bank, $cash, $savings]));
        $this->assertSame([100000, 0, 0], [$balances[$bank->id], $balances[$cash->id], $balances[$savings->id]]);
    }

    public function test_future_transactions_are_blocked(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);

        $this->expectException(ValidationException::class);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 100, category: $category, date: '2026-08-19');
    }

    private function balance($user, $account): int
    {
        return app(AccountBalanceCalculator::class)->forAccounts($user, collect([$account]))[$account->id];
    }
}
