<?php

namespace App\Actions\Money;

use App\Models\MoneyCategory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteUnusedMoneyCategory
{
    public function execute(MoneyCategory $category): void
    {
        DB::transaction(function () use ($category): void {
            $lockedCategory = MoneyCategory::query()->lockForUpdate()->findOrFail($category->id);
            if ($lockedCategory->transactions()->exists()) {
                throw ValidationException::withMessages(['category' => 'Categories with transaction history cannot be deleted. Archive this Category instead.']);
            }
            $lockedCategory->delete();
        }, 3);
    }
}
