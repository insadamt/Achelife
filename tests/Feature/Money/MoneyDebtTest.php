<?php

namespace Tests\Feature\Money;

use App\Actions\Money\DeleteMoneyDebtSettlement;
use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\ForgiveMoneyDebtBalance;
use App\Actions\Money\OpenMoneyDebt;
use App\Actions\Money\RecordMoneyDebtRepayment;
use App\Actions\Portability\RestoreAccountArchive;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Data\Money\MoneyDebtData;
use App\Data\Money\MoneyDebtRepaymentData;
use App\Data\Portability\AccountRestoreRequest;
use App\Enums\MoneyDebtDirection;
use App\Models\MoneyDebt;
use App\Models\Person;
use App\Models\Season;
use App\Models\User;
use App\Services\Money\AccountBalanceCalculator;
use App\Services\Money\MoneyStatistics;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MoneyDebtTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-10 12:00:00');
    }

    public function test_lending_and_partial_repayment_move_accounts_without_becoming_income_or_spending(): void
    {
        $user = $this->moneyUser();
        $person = $user->people()->create(['name' => 'Sara']);
        $cash = $this->moneyAccount($user, 'Cash', 'MAD', 100000);
        $bank = $this->moneyAccount($user, 'Bank', 'MAD');
        $debt = $this->openDebt($user, $person, MoneyDebtDirection::Receivable, 30000, $cash->id);

        $repayment = app(RecordMoneyDebtRepayment::class)->execute($debt, new MoneyDebtRepaymentData(
            amountMinor: 10000,
            accountId: $bank->id,
            settledOn: CarbonImmutable::parse('2026-09-08'),
            note: 'First part',
        ));

        $this->assertSame(20000, $debt->refresh()->remainingAmountMinor());
        $this->assertSame([70000, 10000], [$this->balance($user, $cash), $this->balance($user, $bank)]);
        $this->assertSame('expense', $debt->openingTransaction->type->value);
        $this->assertSame('income', $repayment->transaction->type->value);
        $statistics = app(MoneyStatistics::class)->summarize(
            $user,
            app(ResolveUserSeasonCycle::class)->execute($user),
            'month',
            null,
            'MAD',
            null,
        );
        $accounts = collect($statistics['current']['accounts'])->keyBy('name');
        $this->assertSame(0, $statistics['current']['recordedIncomeMinor']);
        $this->assertSame(0, $statistics['current']['spendingMinor']);
        $this->assertSame(30000, $accounts['Cash']['debtOutMinor']);
        $this->assertSame(10000, $accounts['Bank']['debtInMinor']);
        $this->assertSame(70000, $accounts['Cash']['netMovementMinor']);
        $this->assertSame(10000, $accounts['Bank']['netMovementMinor']);
    }

    public function test_tracked_debt_can_be_forgiven_and_reopened_without_an_extra_account_movement(): void
    {
        $user = $this->moneyUser();
        $person = $user->people()->create(['name' => 'Adam']);
        $account = $this->moneyAccount($user, 'Bank', 'MAD');
        $debt = $this->openDebt($user, $person, MoneyDebtDirection::Payable, 25000, $account->id);

        $forgiveness = app(ForgiveMoneyDebtBalance::class)->execute($debt);

        $this->assertNotNull($debt->opening_transaction_id);
        $this->assertNull($forgiveness->transaction_id);
        $this->assertSame(0, $debt->refresh()->remainingAmountMinor());
        $this->assertSame(1, $user->moneyTransactions()->count());
        $this->assertSame(25000, $this->balance($user, $account));

        app(DeleteMoneyDebtSettlement::class)->execute($forgiveness);

        $this->assertSame(25000, $debt->refresh()->remainingAmountMinor());
    }

    public function test_repayment_validation_prevents_overpayment_wrong_currency_and_future_dates(): void
    {
        $user = $this->moneyUser();
        $person = $user->people()->create(['name' => 'Sara']);
        $mad = $this->moneyAccount($user, 'Cash', 'MAD');
        $usd = $this->moneyAccount($user, 'USD', 'USD');
        $debt = $this->openDebt($user, $person, MoneyDebtDirection::Receivable, 10000, $mad->id);

        foreach ([
            new MoneyDebtRepaymentData(10001, $mad->id, CarbonImmutable::parse('2026-09-10'), null),
            new MoneyDebtRepaymentData(1000, $usd->id, CarbonImmutable::parse('2026-09-10'), null),
            new MoneyDebtRepaymentData(1000, $mad->id, CarbonImmutable::parse('2026-09-11'), null),
        ] as $invalid) {
            try {
                app(RecordMoneyDebtRepayment::class)->execute($debt, $invalid);
                $this->fail('The invalid repayment must fail.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        $this->assertSame(0, $debt->settlements()->count());
    }

    public function test_debt_linked_transactions_are_protected_and_settlement_deletion_reverses_cash(): void
    {
        $user = $this->moneyUser();
        $person = $user->people()->create(['name' => 'Adam']);
        $account = $this->moneyAccount($user, 'Bank', 'MAD');
        $debt = $this->openDebt($user, $person, MoneyDebtDirection::Payable, 20000, $account->id);
        $settlement = app(RecordMoneyDebtRepayment::class)->execute($debt, new MoneyDebtRepaymentData(5000, $account->id, CarbonImmutable::parse('2026-09-10'), null));

        try {
            app(DeleteMoneyTransaction::class)->execute($debt->openingTransaction);
            $this->fail('A linked movement must only be deleted from Debts.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        app(DeleteMoneyDebtSettlement::class)->execute($settlement);

        $this->assertSame(20000, $debt->refresh()->remainingAmountMinor());
        $this->assertSame(20000, $this->balance($user, $account));
        $this->assertSame(1, $user->moneyTransactions()->count());
    }

    public function test_debt_page_can_create_a_person_inline_and_enforces_ownership(): void
    {
        $user = $this->moneyUser();
        $other = $this->moneyUser();
        $account = $this->moneyAccount($user, 'Cash', 'MAD');
        $otherPerson = $other->people()->create(['name' => 'Not mine']);

        $this->actingAs($user)->post('/money/debts', [
            'direction' => 'receivable',
            'amount' => '75.00',
            'create_person' => true,
            'person_name' => 'Nora',
            'opened_on' => '2026-09-10',
        ])->assertSessionHasErrors('account_id');

        $this->actingAs($user)->post('/money/debts', [
            'direction' => 'receivable',
            'amount' => '75.00',
            'create_person' => true,
            'person_name' => 'Nora',
            'person_nickname' => 'N',
            'account_id' => $account->id,
            'opened_on' => '2026-09-10',
        ])->assertRedirect();

        $debt = $user->moneyDebts()->sole();
        $this->assertSame('Nora', $debt->person->name);
        app(ResolveUserSeasonCycle::class)->execute($user)->activeSeason->update(['introduced_at' => now()]);
        $this->get('/money/debts')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('money/debts/Index')
            ->where('debts.0.person.name', 'Nora')
            ->where('debts.0.remainingAmountMinor', 7500));

        $this->post("/money/debts/{$debt->id}/repayments", [
            'amount' => '10.00',
            'settled_on' => '2026-09-10',
        ])->assertSessionHasErrors('account_id');

        $this->post('/money/debts', [
            'direction' => 'payable',
            'amount' => '10.00',
            'create_person' => false,
            'person_id' => $otherPerson->id,
            'account_id' => $account->id,
            'opened_on' => '2026-09-10',
        ])->assertSessionHasErrors('person_id');
    }

    public function test_version_two_archive_round_trips_debt_people_movements_and_settlements(): void
    {
        $source = User::factory()->create(['calendar_started_on' => '2026-09-01', 'timezone' => 'UTC']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-09-01', 'end_date' => '2026-09-30', 'season_points' => 0]);
        $person = $source->people()->create(['name' => 'Sara']);
        $account = $this->moneyAccount($source, 'Cash', 'MAD', 50000);
        $debt = $this->openDebt($source, $person, MoneyDebtDirection::Receivable, 20000, $account->id);
        app(RecordMoneyDebtRepayment::class)->execute($debt, new MoneyDebtRepaymentData(5000, $account->id, CarbonImmutable::parse('2026-09-10'), 'Part'));
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        $path = app(AccountArchiveExporter::class)->export($source);

        try {
            $validated = app(AccountArchiveValidator::class)->validate($path);
            app(RestoreAccountArchive::class)->execute($target, $validated, new AccountRestoreRequest(freshInstall: true));
            $restoredDebt = $target->moneyDebts()->with(['person', 'openingTransaction', 'settlements.transaction'])->sole();

            $this->assertSame(2, $validated->manifest['archive_format_version']);
            $this->assertSame('Sara', $restoredDebt->person->name);
            $this->assertSame(15000, $restoredDebt->remainingAmountMinor());
            $this->assertSame($target->id, $restoredDebt->openingTransaction->user_id);
            $this->assertSame($target->id, $restoredDebt->settlements->sole()->transaction->user_id);
        } finally {
            @unlink($path);
        }
    }

    private function openDebt(User $user, Person $person, MoneyDebtDirection $direction, int $amountMinor, int $accountId): MoneyDebt
    {
        return app(OpenMoneyDebt::class)->execute($user, new MoneyDebtData(
            direction: $direction,
            amountMinor: $amountMinor,
            personId: $person->id,
            personName: null,
            personNickname: null,
            accountId: $accountId,
            openedOn: CarbonImmutable::parse('2026-09-01'),
            dueOn: CarbonImmutable::parse('2026-09-20'),
            note: null,
        ));
    }

    private function balance(User $user, $account): int
    {
        return app(AccountBalanceCalculator::class)->forAccounts($user, collect([$account]))[$account->id];
    }
}
