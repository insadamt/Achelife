<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;
use Illuminate\Validation\ValidationException;

class UpdateMoneyCategory
{
    public function execute(MoneyCategory $category, string $name): MoneyCategory
    {
        if ($category->isCharity()) {
            throw ValidationException::withMessages(['name' => 'The built-in Charity Category cannot be renamed.']);
        }

        $category->update(['name' => $name]);

        return $category->refresh();
    }
}
