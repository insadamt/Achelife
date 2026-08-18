<?php

namespace App\Actions\Money;

use App\Models\MoneySubcategory;

class ReactivateMoneySubcategory
{
    public function execute(MoneySubcategory $subcategory): MoneySubcategory
    {
        $subcategory->update(['archived_at' => null]);

        return $subcategory->refresh();
    }
}
