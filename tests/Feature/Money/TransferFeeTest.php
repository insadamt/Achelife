<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ArchiveMoneyAccount;
use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\InstallMoneyPresetPack;
use App\Actions\Money\SaveMoneyTransaction;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyTransactionType;
use App\Services\Money\AccountBalanceCalculator;
use App\Support\Money\MoneyPresetPack;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class TransferFeeTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-26 10:00:00');
    }

    public function test_transfer_fee_defaults_to_zero_and_positive_fee_changes_only_source_debit(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 100000);
        $cash = $this->moneyAccount($user, 'Cash');
        $freeTransfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 10000, $cash);
        $feeTransfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 20000, $cash, feeMinor: 750);
        $balances = app(AccountBalanceCalculator::class)->forAccounts($user, collect([$bank, $cash]));

        $this->assertSame(0, $freeTransfer->fee_minor);
        $this->assertSame(750, $feeTransfer->fee_minor);
        $this->assertSame(2, $user->moneyTransactions()->count());
        $this->assertSame([69250, 30000], [$balances[$bank->id], $balances[$cash->id]]);
    }

    public function test_fresh_schema_applies_zero_fee_database_default(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank');
        $cash = $this->moneyAccount($user, 'Cash');
        $transactionId = DB::table('money_transactions')->insertGetId([
            'user_id' => $user->id,
            'type' => 'transfer',
            'amount_minor' => 1000,
            'account_id' => $bank->id,
            'destination_account_id' => $cash->id,
            'category_id' => null,
            'subcategory_id' => null,
            'transaction_date' => '2026-08-26',
            'note' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->assertSame(0, DB::table('money_transactions')->where('id', $transactionId)->value('fee_minor'));
    }

    public function test_transfer_request_validates_fee_and_exposes_exact_balance_preview_data(): void
    {
        $user = $this->moneyUser();
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 50000);
        $cash = $this->moneyAccount($user, 'Cash');

        $this->actingAs($user)->post('/money/transactions', [
            'type' => 'transfer',
            'amount' => '120.00',
            'fee' => '2.50',
            'account_id' => $bank->id,
            'destination_account_id' => $cash->id,
            'date' => '2026-08-26',
        ])->assertRedirect();

        $transfer = $user->moneyTransactions()->firstOrFail();
        $this->assertSame([12000, 250], [$transfer->amount_minor, $transfer->fee_minor]);
        $this->actingAs($user)->get('/money/history')->assertInertia(fn ($page) => $page
            ->where('transactions.data.0.feeMinor', 250)
            ->where('transactions.data.0.sourceDebitMinor', 12250)
            ->where('transactions.data.0.destinationCreditMinor', 12000)
            ->where('transactions.data.0.feeCategory.category', 'Financial')
            ->where('transactions.data.0.feeCategory.subcategory', 'Bank Fees'));

        $this->actingAs($user)->post('/money/transactions', [
            'type' => 'transfer',
            'amount' => '10.00',
            'fee' => '-1.00',
            'account_id' => $bank->id,
            'destination_account_id' => $cash->id,
            'date' => '2026-08-26',
        ])->assertSessionHasErrors('fee');
    }

    public function test_fee_is_non_negative_and_restricted_to_transfers_at_domain_boundary(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $destination = $this->moneyAccount($user, 'Destination');
        $category = $this->moneyCategory($user);

        foreach ([
            new MoneyTransactionData(MoneyTransactionType::Transfer, 1000, $account->id, $destination->id, null, null, now()->toImmutable(), null, -1),
            new MoneyTransactionData(MoneyTransactionType::Expense, 1000, $account->id, null, $category->id, null, now()->toImmutable(), null, 100),
        ] as $invalidData) {
            try {
                app(SaveMoneyTransaction::class)->create($user, $invalidData);
                $this->fail('Invalid fee data must be rejected.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        $this->assertDatabaseCount('money_transactions', 0);
    }

    public function test_transfer_fee_edit_and_deletion_reverse_principal_and_fee_atomically(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 100000);
        $cash = $this->moneyAccount($user, 'Cash');
        $savings = $this->moneyAccount($user, 'Savings');
        $transfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 30000, $cash, feeMinor: 500);
        $updatedData = new MoneyTransactionData(
            type: MoneyTransactionType::Transfer,
            amountMinor: 20000,
            accountId: $cash->id,
            destinationAccountId: $savings->id,
            categoryId: null,
            subcategoryId: null,
            date: CarbonImmutable::parse('2026-08-25'),
            note: 'Moved',
            feeMinor: 250,
        );

        app(SaveMoneyTransaction::class)->update($user, $transfer, $updatedData);
        $this->assertSame([100000, -20250, 20000], $this->balances($user, [$bank, $cash, $savings]));
        app(DeleteMoneyTransaction::class)->execute($transfer);
        $this->assertSame([100000, 0, 0], $this->balances($user, [$bank, $cash, $savings]));
    }

    public function test_existing_archived_transfer_accounts_can_be_preserved_but_not_newly_selected(): void
    {
        $user = $this->moneyUser();
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 50000);
        $cash = $this->moneyAccount($user, 'Cash');
        $archived = $this->moneyAccount($user, 'Archived');
        $transfer = $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 10000, $cash, feeMinor: 100);
        app(ArchiveMoneyAccount::class)->execute($bank);
        app(ArchiveMoneyAccount::class)->execute($cash);
        app(ArchiveMoneyAccount::class)->execute($archived);

        $unchangedAccounts = new MoneyTransactionData(MoneyTransactionType::Transfer, 9000, $bank->id, $cash->id, null, null, now()->toImmutable(), null, 90);
        app(SaveMoneyTransaction::class)->update($user, $transfer, $unchangedAccounts);
        $this->assertSame(90, $transfer->refresh()->fee_minor);

        $this->expectException(ValidationException::class);
        $newArchivedDestination = new MoneyTransactionData(MoneyTransactionType::Transfer, 9000, $bank->id, $archived->id, null, null, now()->toImmutable(), null, 90);
        app(SaveMoneyTransaction::class)->update($user, $transfer, $newArchivedDestination);
    }

    public function test_transfer_fee_edit_and_deletion_require_ownership(): void
    {
        $owner = $this->moneyUser();
        $intruder = $this->moneyUser();
        $bank = $this->moneyAccount($owner, 'Bank', initialMinor: 50000);
        $cash = $this->moneyAccount($owner, 'Cash');
        $transfer = $this->moneyTransaction($owner, MoneyTransactionType::Transfer, $bank, 10000, $cash, feeMinor: 100);

        $this->actingAs($intruder)->put("/money/transactions/{$transfer->id}", [
            'amount' => '90.00',
            'fee' => '1.00',
            'account_id' => $bank->id,
            'destination_account_id' => $cash->id,
            'date' => '2026-08-26',
        ])->assertForbidden();
        $this->actingAs($intruder)->delete("/money/transactions/{$transfer->id}")->assertForbidden();

        $this->assertDatabaseHas('money_transactions', ['id' => $transfer->id, 'amount_minor' => 10000, 'fee_minor' => 100]);
    }

    public function test_financial_and_bank_fee_filters_project_fee_without_duplicate_transactions(): void
    {
        $user = $this->moneyUser();
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        app(InstallMoneyPresetPack::class)->execute($user);
        $bank = $this->moneyAccount($user, 'Bank', initialMinor: 20000);
        $cash = $this->moneyAccount($user, 'Cash');
        $this->moneyTransaction($user, MoneyTransactionType::Transfer, $bank, 5000, $cash, feeMinor: 125);
        $financialId = $user->moneyCategories()->where('preset_key', MoneyPresetPack::FINANCIAL_CATEGORY_KEY)->value('id');
        $bankFeesId = $user->moneySubcategories()->where('preset_key', MoneyPresetPack::BANK_FEES_SUBCATEGORY_KEY)->value('id');

        $this->actingAs($user)->get("/money/history?category={$financialId}&subcategory={$bankFeesId}")
            ->assertInertia(fn ($page) => $page->has('transactions.data', 1)->where('transactions.data.0.feeMinor', 125));
        $this->actingAs($user)->get('/money/history?search=Bank%20Fees')
            ->assertInertia(fn ($page) => $page->has('transactions.data', 1));
        $this->assertDatabaseCount('money_transactions', 1);
    }

    /** @param list<object> $accounts
     * @return list<int>
     */
    private function balances($user, array $accounts): array
    {
        $balances = app(AccountBalanceCalculator::class)->forAccounts($user, collect($accounts));

        return array_map(fn ($account): int => $balances[$account->id], $accounts);
    }
}
