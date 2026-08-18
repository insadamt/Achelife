<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;

class ReactivateMoneyCategory
{
    public function execute(MoneyCategory $category): MoneyCategory
    {
        $category->update(['archived_at' => null]);

        return $category->refresh();
    }
}
