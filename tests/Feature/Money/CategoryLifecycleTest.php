<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ArchiveMoneyCategory;
use App\Actions\Money\ArchiveMoneySubcategory;
use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\DeleteUnusedMoneyCategory;
use App\Actions\Money\DeleteUnusedMoneySubcategory;
use App\Actions\Money\EnsureDefaultMoneyCategories;
use App\Actions\Money\ReactivateMoneyCategory;
use App\Actions\Money\ReactivateMoneySubcategory;
use App\Actions\Money\UpdateMoneyCategory;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class CategoryLifecycleTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_categories_are_type_specific_and_subcategory_must_match_parent(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $income = $this->moneyCategory($user, MoneyCategoryType::Income, 'Salary');
        $expense = $this->moneyCategory($user);
        $subcategory = $this->moneySubcategory($expense);

        foreach (
            [
                fn () => $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 100, category: $expense),
                fn () => $this->moneyTransaction($user, MoneyTransactionType::Income, $account, 100, category: $income, subcategory: $subcategory),
            ] as $invalidTransaction
        ) {
            try {
                $invalidTransaction();
                $this->fail('Category integrity must be enforced.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }
    }

    public function test_unused_category_and_subcategory_can_be_deleted(): void
    {
        $user = $this->moneyUser();
        $category = $this->moneyCategory($user);
        $subcategory = $this->moneySubcategory($category);
        app(DeleteUnusedMoneySubcategory::class)->execute($subcategory);
        $this->assertDatabaseMissing('money_subcategories', ['id' => $subcategory->id]);

        app(DeleteUnusedMoneyCategory::class)->execute($category);
        $this->assertDatabaseMissing('money_categories', ['id' => $category->id]);
    }

    public function test_used_category_and_subcategory_require_archive_and_can_be_reactivated(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $subcategory = $this->moneySubcategory($category);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 100, category: $category, subcategory: $subcategory);

        foreach ([fn () => app(DeleteUnusedMoneyCategory::class)->execute($category), fn () => app(DeleteUnusedMoneySubcategory::class)->execute($subcategory)] as $delete) {
            try {
                $delete();
                $this->fail('Used categorization must not be deleted.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        app(ArchiveMoneyCategory::class)->execute($category);
        app(ArchiveMoneySubcategory::class)->execute($subcategory);
        $this->assertNotNull($category->refresh()->archived_at);
        $this->assertNotNull($subcategory->refresh()->archived_at);
        app(ReactivateMoneyCategory::class)->execute($category);
        app(ReactivateMoneySubcategory::class)->execute($subcategory);
        $this->assertNull($category->refresh()->archived_at);
        $this->assertNull($subcategory->refresh()->archived_at);
    }

    public function test_archived_category_or_subcategory_is_unavailable_for_new_transactions(): void
    {
        $user = $this->moneyUser();
        $account = $this->moneyAccount($user);
        $category = $this->moneyCategory($user);
        $subcategory = $this->moneySubcategory($category);
        app(ArchiveMoneySubcategory::class)->execute($subcategory);

        try {
            $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 100, category: $category, subcategory: $subcategory);
            $this->fail('Archived Subcategory must be unavailable.');
        } catch (ValidationException) {
            $this->addToAssertionCount(1);
        }

        app(ReactivateMoneySubcategory::class)->execute($subcategory);
        app(ArchiveMoneyCategory::class)->execute($category);
        $this->expectException(ValidationException::class);
        $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 100, category: $category, subcategory: $subcategory);
    }

    public function test_charity_is_automatic_expense_only_protected_and_accepts_custom_subcategories(): void
    {
        $user = $this->moneyUser();
        $charity = app(EnsureDefaultMoneyCategories::class)->execute($user);
        $sameCharity = app(EnsureDefaultMoneyCategories::class)->execute($user);
        $subcategory = $this->moneySubcategory($charity, 'Mosque');
        $account = $this->moneyAccount($user);
        $transaction = $this->moneyTransaction($user, MoneyTransactionType::Expense, $account, 2500, category: $charity, subcategory: $subcategory);

        $this->assertTrue($charity->is($sameCharity));
        $this->assertSame(MoneyCategoryType::Expense, $charity->type);
        $this->assertSame('Mosque', $subcategory->name);
        $this->assertSame(2500, $transaction->amount_minor);

        foreach (
            [
                fn () => app(UpdateMoneyCategory::class)->execute($charity, 'Giving'),
                fn () => app(ArchiveMoneyCategory::class)->execute($charity),
                fn () => app(DeleteUnusedMoneyCategory::class)->execute($charity),
            ] as $protectedMutation
        ) {
            try {
                $protectedMutation();
                $this->fail('Charity must be protected.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        app(DeleteMoneyTransaction::class)->execute($transaction);
        $this->assertDatabaseMissing('money_transactions', ['id' => $transaction->id]);
    }

    public function test_registration_creates_charity_automatically(): void
    {
        $this->post('/register', [
            'name' => 'Money User',
            'email' => 'money@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertRedirect('/season-introduction');

        $this->assertDatabaseHas('money_categories', [
            'name' => 'Charity',
            'type' => 'expense',
            'builtin_key' => 'charity',
        ]);
    }
}
