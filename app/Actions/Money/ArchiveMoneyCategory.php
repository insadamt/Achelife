<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;
use Illuminate\Validation\ValidationException;

class ArchiveMoneyCategory
{
    public function execute(MoneyCategory $category): MoneyCategory
    {
        if ($category->isCharity()) {
            throw ValidationException::withMessages(['category' => 'The built-in Charity Category is always available and cannot be archived.']);
        }

        $category->update(['archived_at' => now()]);

        return $category->refresh();
    }
}
