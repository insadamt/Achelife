<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ArchiveMoneyCategory;
use App\Actions\Money\ArchiveMoneySubcategory;
use App\Actions\Money\DeleteUnusedMoneyCategory;
use App\Actions\Money\DeleteUnusedMoneySubcategory;
use App\Actions\Money\ReactivateMoneyCategory;
use App\Actions\Money\ReactivateMoneySubcategory;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use App\Models\User;
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

    public function test_single_user_setup_leaves_money_presets_for_first_run_selection(): void
    {
        $this->post('/setup', [
            'name' => 'Money User',
        ])->assertRedirect('/onboarding');

        $this->assertDatabaseCount('money_categories', 0);
        $this->assertSame(0, User::query()->sole()->money_preset_pack_version);
    }
}
