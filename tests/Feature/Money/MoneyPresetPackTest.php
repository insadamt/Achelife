<?php

namespace Tests\Feature\Money;

use App\Actions\Money\ArchiveMoneyCategory;
use App\Actions\Money\ArchiveMoneySubcategory;
use App\Actions\Money\DeleteUnusedMoneyCategory;
use App\Actions\Money\DeleteUnusedMoneySubcategory;
use App\Actions\Money\InstallMoneyPresetPack;
use App\Actions\Money\UpdateMoneyCategory;
use App\Actions\Money\UpdateMoneySubcategory;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Support\Money\MoneyPresetPack;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class MoneyPresetPackTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-26 10:00:00');
    }

    public function test_complete_pack_installs_once_with_stable_keys(): void
    {
        $user = $this->moneyUser();
        $result = app(InstallMoneyPresetPack::class)->execute($user);
        $secondResult = app(InstallMoneyPresetPack::class)->execute($user);

        $this->assertSame([20, 80], [$result->categoriesCreated, $result->subcategoriesCreated]);
        $this->assertSame([0, 0], [$secondResult->categoriesCreated, $secondResult->subcategoriesCreated]);
        $this->assertSame(MoneyPresetPack::VERSION, $user->refresh()->money_preset_pack_version);
        $this->assertSame(20, $user->moneyCategories()->whereNotNull('preset_key')->distinct()->count('preset_key'));
        $this->assertSame(80, $user->moneySubcategories()->whereNotNull('preset_key')->distinct()->count('preset_key'));
        $this->assertDatabaseHas('money_subcategories', [
            'preset_key' => 'money.expense.gifts-donations.charity',
            'name' => 'Charity',
        ]);
        $this->assertDatabaseHas('money_subcategories', [
            'preset_key' => MoneyPresetPack::BANK_FEES_SUBCATEGORY_KEY,
            'name' => 'Bank Fees',
        ]);
    }

    public function test_installation_repairs_deleted_presets_without_resetting_renames_or_archives(): void
    {
        $user = $this->moneyUser();
        app(InstallMoneyPresetPack::class)->execute($user);
        $housing = $user->moneyCategories()->where('preset_key', 'money.expense.housing')->firstOrFail();
        $rent = $user->moneySubcategories()->where('preset_key', 'money.expense.housing.rent')->firstOrFail();
        $mortgage = $user->moneySubcategories()->where('preset_key', 'money.expense.housing.mortgage')->firstOrFail();
        $other = $user->moneyCategories()->where('preset_key', 'money.expense.other')->firstOrFail();

        app(UpdateMoneyCategory::class)->execute($housing, 'My Home');
        app(ArchiveMoneySubcategory::class)->execute($rent);
        app(DeleteUnusedMoneySubcategory::class)->execute($mortgage);
        app(DeleteUnusedMoneyCategory::class)->execute($other);
        $repair = app(InstallMoneyPresetPack::class)->execute($user);

        $this->assertSame([1, 3], [$repair->categoriesCreated, $repair->subcategoriesCreated]);
        $this->assertSame('My Home', $housing->refresh()->name);
        $this->assertNotNull($rent->refresh()->archived_at);
        $this->assertDatabaseHas('money_subcategories', ['preset_key' => 'money.expense.housing.mortgage', 'name' => 'Mortgage']);
        $this->assertDatabaseHas('money_categories', ['preset_key' => 'money.expense.other', 'name' => 'Other']);
    }

    public function test_preset_categories_and_subcategories_follow_ordinary_lifecycle_rules(): void
    {
        $user = $this->moneyUser();
        app(InstallMoneyPresetPack::class)->execute($user);
        $category = $user->moneyCategories()->where('preset_key', 'money.income.freelance')->firstOrFail();
        $subcategory = $user->moneySubcategories()->where('preset_key', 'money.income.freelance.contract-work')->firstOrFail();

        app(UpdateMoneyCategory::class)->execute($category, 'Independent Work');
        app(UpdateMoneySubcategory::class)->execute($subcategory, 'Retainers');
        app(ArchiveMoneyCategory::class)->execute($category);

        $this->assertSame('money.income.freelance', $category->refresh()->preset_key);
        $this->assertSame('money.income.freelance.contract-work', $subcategory->refresh()->preset_key);
        $this->assertNotNull($category->archived_at);
    }

    public function test_categories_page_previews_pack_and_searchable_hierarchy_data(): void
    {
        $user = $this->moneyUser();
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $this->actingAs($user)->get('/money/categories')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('money/categories/Index')
                ->where('presetPack.version', 1)
                ->where('presetPack.categoryCount', 20)
                ->where('presetPack.subcategoryCount', 80)
                ->has('presetPack.categories', 20));

        $this->actingAs($user)->post('/money/presets/install')->assertRedirect();
        $this->assertSame(1, $user->refresh()->money_preset_pack_version);
    }
}
