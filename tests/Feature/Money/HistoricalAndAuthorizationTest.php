<?php

namespace Tests\Feature\Money;

use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\SaveMoneyTransaction;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use App\Services\Money\AccountBalanceCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class HistoricalAndAuthorizationTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_old_season_transaction_remains_editable_and_deletable_without_sp_changes(): void
    {
        $user = $this->moneyUser('2026-06-01');
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-08-18'));
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user, MoneyCategoryType::Income, 'Freelance');
        $transaction = $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 50000, category: $category, date: '2026-06-10');
        $seasonPoints = $user->seasons()->pluck('season_points', 'id')->all();
        $data = new MoneyTransactionData(MoneyTransactionType::Income, 30000, $account->id, null, $category->id, null, CarbonImmutable::parse('2026-06-10'), 'Corrected');

        app(SaveMoneyTransaction::class)->update($user, $transaction, $data);
        $this->assertSame(30000, app(AccountBalanceCalculator::class)->forAccounts($user, collect([$account]))[$account->id]);
        $this->assertSame($seasonPoints, $user->seasons()->pluck('season_points', 'id')->all());

        app(DeleteMoneyTransaction::class)->execute($transaction);
        $this->assertSame(0, app(AccountBalanceCalculator::class)->forAccounts($user, collect([$account]))[$account->id]);
        $this->assertSame($seasonPoints, $user->seasons()->pluck('season_points', 'id')->all());
    }

    public function test_cross_user_money_routes_are_forbidden(): void
    {
        $owner = $this->moneyUser();
        $intruder = $this->moneyUser();
        $intruderSeason = app(SynchronizeUserSeasons::class)->execute($intruder, CarbonImmutable::parse('2026-08-18'));
        $intruderSeason->update(['introduced_at' => now()]);
        $account = $this->moneyAccount($owner);
        $otherAccount = $this->moneyAccount($owner, 'Bank');
        $category = $this->moneyCategory($owner);
        $subcategory = $this->moneySubcategory($category);
        $transaction = $this->moneyTransaction($owner, MoneyTransactionType::Expense, $account, 100, category: $category, subcategory: $subcategory);

        foreach (
            [
                ['get', "/money/accounts/{$account->id}", []],
                ['put', "/money/accounts/{$account->id}", ['name' => 'Stolen', 'currency' => 'MAD', 'initial_balance' => '0']],
                ['post', "/money/accounts/{$account->id}/archive", []],
                ['post', "/money/accounts/{$account->id}/reactivate", []],
                ['delete', "/money/accounts/{$account->id}", []],
                ['put', "/money/categories/{$category->id}", ['name' => 'Stolen']],
                ['post', "/money/categories/{$category->id}/archive", []],
                ['post', "/money/categories/{$category->id}/reactivate", []],
                ['delete', "/money/categories/{$category->id}", []],
                ['put', "/money/subcategories/{$subcategory->id}", ['name' => 'Stolen']],
                ['post', "/money/subcategories/{$subcategory->id}/archive", []],
                ['post', "/money/subcategories/{$subcategory->id}/reactivate", []],
                ['delete', "/money/subcategories/{$subcategory->id}", []],
                ['put', "/money/transactions/{$transaction->id}", ['amount' => '2', 'account_id' => $otherAccount->id, 'category_id' => $category->id, 'date' => '2026-08-18']],
                ['delete', "/money/transactions/{$transaction->id}", []],
            ] as [$method, $uri, $payload]
        ) {
            $this->actingAs($intruder)->json(strtoupper($method), $uri, $payload)->assertForbidden();
        }
    }

    public function test_foreign_accounts_categories_and_subcategories_cannot_be_used_on_create(): void
    {
        $owner = $this->moneyUser();
        $intruder = $this->moneyUser();
        $account = $this->moneyAccount($owner);
        $category = $this->moneyCategory($owner);
        $subcategory = $this->moneySubcategory($category);
        $ownAccount = $this->moneyAccount($intruder);

        $this->actingAs($intruder)->post('/money/transactions', [
            'type' => 'expense',
            'amount' => '10.00',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'date' => '2026-08-18',
        ])->assertSessionHasErrors('account_id');

        $this->actingAs($intruder)->post('/money/transactions', [
            'type' => 'expense',
            'amount' => '10.00',
            'account_id' => $ownAccount->id,
            'category_id' => $category->id,
            'subcategory_id' => $subcategory->id,
            'date' => '2026-08-18',
        ])->assertSessionHasErrors('category_id');

        $this->actingAs($intruder)->post('/money/transactions', [
            'type' => 'transfer',
            'amount' => '10.00',
            'account_id' => $ownAccount->id,
            'destination_account_id' => $account->id,
            'date' => '2026-08-18',
        ])->assertSessionHasErrors('account_id');

        $this->actingAs($intruder)->post('/money/subcategories', [
            'category_id' => $category->id,
            'name' => 'Foreign child',
        ])->assertSessionHasErrors('category_id');
    }

    public function test_history_supports_filters_and_portable_text_search(): void
    {
        $user = $this->moneyUser();
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-08-18'));
        $season->update(['introduced_at' => now()]);
        $account = $this->moneyAccount($user);
        $food = $this->moneyCategory($user);
        $groceries = $this->moneySubcategory($food);
        $income = $this->moneyCategory($user, MoneyCategoryType::Income, 'Salary');
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 1000, category: $food, subcategory: $groceries, date: '2026-08-10', note: 'Weekly shop');
        $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 50000, category: $income, date: '2026-08-11');

        $this->actingAs($user)->get('/money/history?type=expense&account='.$account->id.'&category='.$food->id.'&from=2026-08-01&to=2026-08-15&search=Grocer')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('money/History')->has('transactions.data', 1));
    }
}
