<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;
use App\Services\Money\MoneyCategoryColorService;

class UpdateMoneyCategory
{
    public function __construct(private readonly MoneyCategoryColorService $colors) {}

    public function execute(MoneyCategory $category, string $name, ?string $color = null): MoneyCategory
    {
        $category->update([
            'name' => $name,
            'color' => $this->colors->uniqueColor($category->user, $category->type, $color ?? $category->color, $category->id),
        ]);

        return $category->refresh();
    }
}
