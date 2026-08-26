<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;

class ArchiveMoneyCategory
{
    public function execute(MoneyCategory $category): MoneyCategory
    {
        $category->update(['archived_at' => now()]);

        return $category->refresh();
    }
}
