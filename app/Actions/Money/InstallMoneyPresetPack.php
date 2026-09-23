<?php

namespace App\Actions\Money;

use App\Data\Money\MoneyPresetInstallationResult;
use App\Models\MoneyCategory;
use App\Models\User;
use App\Services\Money\MoneyCategoryColorService;
use App\Support\Money\MoneyPresetPack;
use Illuminate\Support\Facades\DB;

class InstallMoneyPresetPack
{
    public function __construct(private readonly MoneyPresetPack $presetPack, private readonly MoneyCategoryColorService $colors) {}

    public function execute(User $user): MoneyPresetInstallationResult
    {
        return DB::transaction(function () use ($user): MoneyPresetInstallationResult {
            User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();
            $categoriesCreated = 0;
            $subcategoriesCreated = 0;

            foreach ($this->presetPack->definitions() as $definition) {
                $category = $user->moneyCategories()->firstOrCreate(
                    ['preset_key' => $definition['key']],
                    ['name' => $definition['name'], 'type' => $definition['type'], 'color' => $this->colors->uniqueColor($user, $definition['type'], null)],
                );
                $categoriesCreated += $category->wasRecentlyCreated ? 1 : 0;
                $subcategoriesCreated += $this->installMissingSubcategories($category, $definition['subcategories']);
            }

            $user->update(['money_preset_pack_version' => MoneyPresetPack::VERSION]);

            return new MoneyPresetInstallationResult($categoriesCreated, $subcategoriesCreated);
        }, 3);
    }

    /** @param list<array{key: string, name: string}> $definitions */
    private function installMissingSubcategories(MoneyCategory $category, array $definitions): int
    {
        $created = 0;

        foreach ($definitions as $definition) {
            $subcategory = $category->subcategories()->firstOrCreate(
                ['preset_key' => $definition['key']],
                ['user_id' => $category->user_id, 'name' => $definition['name']],
            );
            $created += $subcategory->wasRecentlyCreated ? 1 : 0;
        }

        return $created;
    }
}
