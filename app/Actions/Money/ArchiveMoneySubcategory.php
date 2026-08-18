<?php

namespace App\Actions\Money;

use App\Models\MoneySubcategory;

class ArchiveMoneySubcategory
{
    public function execute(MoneySubcategory $subcategory): MoneySubcategory
    {
        $subcategory->update(['archived_at' => now()]);

        return $subcategory->refresh();
    }
}
