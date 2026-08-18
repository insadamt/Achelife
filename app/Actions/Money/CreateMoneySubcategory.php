<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;
use App\Models\MoneySubcategory;
use Illuminate\Validation\ValidationException;

class CreateMoneySubcategory
{
    public function execute(MoneyCategory $category, string $name): MoneySubcategory
    {
        if ($category->archived_at !== null) {
            throw ValidationException::withMessages(['category_id' => 'Reactivate the parent Category before adding a Subcategory.']);
        }

        return $category->subcategories()->create(['user_id' => $category->user_id, 'name' => $name]);
    }
}
