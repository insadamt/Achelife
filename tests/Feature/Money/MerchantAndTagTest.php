<?php

namespace Tests\Feature\Money;

use App\Actions\Money\SaveMoneyTransaction;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MerchantAndTagTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-09-12 10:00:00');
    }

    public function test_transaction_creates_reuses_and_updates_user_owned_merchants_and_tags(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);

        $this->actingAs($user)->post('/money/transactions', [
            'type' => 'expense',
            'amount' => '42.50',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'merchant' => '  Steam  ',
            'tags' => ['Games', 'Retro'],
            'date' => '2026-09-12',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $transaction = $user->moneyTransactions()->with(['merchant', 'tags'])->sole();
        $this->assertSame('Steam', $transaction->merchant->name);
        $this->assertSame(['Games', 'Retro'], $transaction->tags->pluck('name')->sort()->values()->all());
        $this->assertMatchesRegularExpression('/^#[0-9A-F]{6}$/', $transaction->tags->first()->color);

        $this->actingAs($user)->put("/money/transactions/{$transaction->id}", [
            'amount' => '42.50',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'merchant' => 'steam',
            'tags' => ['Games', 'Physical'],
            'date' => '2026-09-12',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseCount('money_merchants', 1);
        $this->assertDatabaseCount('money_tags', 3);
        $this->assertSame(['Games', 'Physical'], $transaction->refresh()->tags()->pluck('name')->sort()->values()->all());
    }

    public function test_transfer_rejects_merchant_and_tags_without_creating_metadata(): void
    {
        $user = $this->moneyUser();
        $source = $this->moneyAccount($user, 'Bank');
        $destination = $this->moneyAccount($user, 'Cash');

        try {
            $this->moneyTransactionWithMetadata($user, $source, $destination);
            $this->fail('Transfers with Merchant or Tag metadata must fail.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        $this->assertDatabaseCount('money_transactions', 0);
        $this->assertDatabaseCount('money_merchants', 0);
        $this->assertDatabaseCount('money_tags', 0);
    }

    public function test_history_filters_and_search_include_merchants_and_tags(): void
    {
        $user = $this->moneyUser();
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-09-12'));
        $season->update(['introduced_at' => now()]);
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $transaction = $this->actingAs($user)->post('/money/transactions', [
            'type' => 'expense',
            'amount' => '10.00',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'merchant' => 'Steam',
            'tags' => ['Retro'],
            'date' => '2026-09-12',
        ]);
        $transaction->assertSessionHasNoErrors();

        $merchant = $user->moneyMerchants()->sole();
        $tag = $user->moneyTags()->sole();

        foreach (["/money/history?merchant={$merchant->id}", "/money/history?tag={$tag->id}", '/money/history?search=retro', '/money/history?search=steam'] as $url) {
            $this->get($url)->assertInertia(fn ($page) => $page
                ->has('transactions.data', 1)
                ->where('transactions.data.0.merchant.name', 'Steam')
                ->where('transactions.data.0.tags.0.name', 'Retro'));
        }
    }

    private function moneyTransactionWithMetadata(User $user, MoneyAccount $source, MoneyAccount $destination): void
    {
        app(SaveMoneyTransaction::class)->create($user, new MoneyTransactionData(
            type: MoneyTransactionType::Transfer,
            amountMinor: 1000,
            accountId: $source->id,
            destinationAccountId: $destination->id,
            categoryId: null,
            subcategoryId: null,
            date: CarbonImmutable::parse('2026-09-12'),
            note: null,
            merchantName: 'Bank',
            tagNames: ['Internal'],
        ));
    }
}
