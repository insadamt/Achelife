<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;

class UpdateMoneyCategory
{
    public function execute(MoneyCategory $category, string $name): MoneyCategory
    {
        $category->update(['name' => $name]);

        return $category->refresh();
    }
}
