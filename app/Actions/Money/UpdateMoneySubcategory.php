<?php

namespace App\Actions\Money;

use App\Models\MoneySubcategory;

class UpdateMoneySubcategory
{
    public function execute(MoneySubcategory $subcategory, string $name): MoneySubcategory
    {
        $subcategory->update(['name' => $name]);

        return $subcategory->refresh();
    }
}
