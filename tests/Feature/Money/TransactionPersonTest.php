<?php

namespace Tests\Feature\Money;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\MoneyCategoryType;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Money\AccountBalanceCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class TransactionPersonTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-12 12:00:00');
    }

    public function test_links_income_and_expense_without_changing_balance_or_creating_debt(): void
    {
        $user = $this->moneyUser();
        $person = $user->people()->create(['name' => 'Sara']);
        $expense = $this->payload($user);
        $this->actingAs($user)->post('/money/transactions', $expense + ['person_id' => $person->id, 'merchant' => 'Amazon'])
            ->assertSessionHasNoErrors();
        $income = $expense;
        $income['type'] = 'income';
        $income['category_id'] = $this->moneyCategory($user, MoneyCategoryType::Income, 'Work')->id;
        $this->post('/money/transactions', $income + ['person_id' => $person->id])->assertSessionHasNoErrors();
        $this->assertSame(2, $person->moneyTransactions()->count());
        $this->assertSame(0, app(AccountBalanceCalculator::class)->forAccounts($user, $user->moneyAccounts()->get())[$expense['account_id']]);
        $this->assertDatabaseCount('money_debts', 0);
        $this->assertSame('Amazon', $user->moneyTransactions()->where('type', 'expense')->sole()->merchant->name);
    }

    public function test_create_person_is_atomic_and_link_can_be_replaced_removed_or_preserved_by_old_payload(): void
    {
        $user = $this->moneyUser();
        $payload = $this->payload($user);
        $this->actingAs($user)->post('/money/transactions', $payload + ['person_name' => '  Sara  '])->assertSessionHasNoErrors();
        $transaction = $user->moneyTransactions()->sole();
        $originalPersonId = $transaction->person_id;
        $this->assertSame('Sara', $transaction->person->name);
        $this->put("/money/transactions/{$transaction->id}", $payload)->assertSessionHasNoErrors();
        $this->assertSame($originalPersonId, $transaction->refresh()->person_id);
        $other = $user->people()->create(['name' => 'Ali']);
        $this->put("/money/transactions/{$transaction->id}", $payload + ['person_id' => $other->id])->assertSessionHasNoErrors();
        $this->assertSame($other->id, $transaction->refresh()->person_id);
        $this->put("/money/transactions/{$transaction->id}", $payload + ['person_id' => null])->assertSessionHasNoErrors();
        $this->assertNull($transaction->refresh()->person_id);
        $this->put("/money/transactions/{$transaction->id}", $payload + ['person_name' => 'New contact'])->assertSessionHasNoErrors();
        $this->assertSame('New contact', $transaction->refresh()->person->name);
        $payload['amount'] = '0.00';
        $this->post('/money/transactions', $payload + ['person_name' => 'Invalid'])->assertSessionHasErrors('amount');
        $this->assertDatabaseCount('people', 3);
    }

    public function test_rejects_foreign_archived_and_transfer_people_and_conflicting_inputs(): void
    {
        $user = $this->moneyUser();
        $payload = $this->payload($user);
        $foreign = User::factory()->create()->people()->create(['name' => 'Foreign']);
        $archived = $user->people()->create(['name' => 'Archived', 'archived_at' => now()]);
        $this->actingAs($user)->post('/money/transactions', $payload + ['person_id' => $foreign->id])->assertSessionHasErrors('person_id');
        $this->post('/money/transactions', $payload + ['person_id' => $archived->id])->assertSessionHasErrors('person_id');
        $this->post('/money/transactions', $payload + ['person_id' => $archived->id, 'person_name' => 'New'])->assertSessionHasErrors('person_id');
        $payload['type'] = 'transfer';
        unset($payload['category_id']);
        $payload['destination_account_id'] = $this->moneyAccount($user, 'Bank')->id;
        $this->post('/money/transactions', $payload + ['person_name' => 'New'])->assertSessionHasErrors('person_id');
        $this->assertDatabaseCount('money_transactions', 0);
    }

    public function test_used_person_can_be_archived_but_not_deleted_and_retained_on_edits(): void
    {
        $user = $this->moneyUser();
        $payload = $this->payload($user);
        $person = $user->people()->create(['name' => 'Sara']);
        $this->actingAs($user)->post('/money/transactions', $payload + ['person_id' => $person->id])->assertSessionHasNoErrors();
        $this->delete("/diary/people/{$person->id}")->assertSessionHasErrors('person');
        $this->post("/diary/people/{$person->id}/archive")->assertSessionHasNoErrors();
        $transaction = $user->moneyTransactions()->sole();
        $this->put("/money/transactions/{$transaction->id}", $payload + ['person_id' => $person->id])->assertSessionHasNoErrors();
        $this->assertNotNull($person->refresh()->archived_at);
    }

    public function test_history_search_filter_and_totals_keep_currency_boundaries_across_pages(): void
    {
        $user = $this->moneyUser();
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $payload = $this->payload($user);
        $person = $user->people()->create(['name' => 'Sara', 'nickname' => 'Client']);
        $this->actingAs($user);
        for ($index = 0; $index < 31; $index++) {
            $this->post('/money/transactions', $payload + ['person_id' => $person->id])->assertSessionHasNoErrors();
        }
        $payload['account_id'] = $this->moneyAccount($user, 'Euro', 'EUR')->id;
        $payload['type'] = 'income';
        $payload['category_id'] = $this->moneyCategory($user, MoneyCategoryType::Income)->id;
        $this->post('/money/transactions', $payload + ['person_id' => $person->id])->assertSessionHasNoErrors();
        $this->get('/money/history?person='.$person->id)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('transactions.total', 32)->has('transactions.data', 30)
            ->where('personSummary.0.currency', 'EUR')->where('personSummary.0.incomeMinor', 1000)
            ->where('personSummary.0.expenseMinor', 0)->where('personSummary.1.currency', 'MAD')
            ->where('personSummary.1.expenseMinor', 31000));
        $this->get('/money/history?search=Client')->assertInertia(fn (Assert $page) => $page->where('transactions.total', 32));
        $this->get('/money/history?person='.$person->id.'&currency=EUR')->assertInertia(fn (Assert $page) => $page->has('personSummary', 1)->where('transactions.total', 1));
        $foreign = User::factory()->create()->people()->create(['name' => 'Other']);
        $this->get('/money/history?person='.$foreign->id)->assertSessionHasErrors('person');
    }

    public function test_upgrade_preserves_existing_transactions_with_no_person_link(): void
    {
        $user = $this->moneyUser();
        $payload = $this->payload($user);
        $this->actingAs($user)->post('/money/transactions', $payload)->assertSessionHasNoErrors();
        $transaction = $user->moneyTransactions()->sole();
        $migration = require database_path('migrations/2026_10_06_100000_add_person_to_money_transactions.php');
        $migration->down();
        $migration->up();
        $this->assertSame(1000, $transaction->refresh()->amount_minor);
        $this->assertSame($payload['account_id'], $transaction->account_id);
        $this->assertNull($transaction->person_id);
    }

    public function test_database_rejects_cross_user_person_assignment(): void
    {
        $user = $this->moneyUser();
        $foreign = User::factory()->create()->people()->create(['name' => 'Other']);
        $payload = $this->payload($user);
        $this->actingAs($user)->post('/money/transactions', $payload)->assertSessionHasNoErrors();
        $this->expectException(QueryException::class);
        MoneyTransaction::query()->update(['person_id' => $foreign->id]);
    }

    private function payload(User $user): array
    {
        return ['type' => 'expense', 'amount' => '10.00', 'account_id' => $this->moneyAccount($user)->id,
            'category_id' => $this->moneyCategory($user)->id, 'date' => '2026-09-12'];
    }
}
