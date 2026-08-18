<?php

namespace App\Actions\Money;

use App\Models\MoneySubcategory;
use Illuminate\Validation\ValidationException;

class DeleteUnusedMoneySubcategory
{
    public function execute(MoneySubcategory $subcategory): void
    {
        if ($subcategory->transactions()->exists()) {
            throw ValidationException::withMessages(['subcategory' => 'Subcategories with transaction history cannot be deleted. Archive this Subcategory instead.']);
        }

        $subcategory->delete();
    }
}
