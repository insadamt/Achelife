<?php

namespace App\Actions\Money;

use App\Enums\MoneyCategoryType;
use App\Models\MoneyCategory;
use App\Models\User;

class EnsureDefaultMoneyCategories
{
    public function execute(User $user): MoneyCategory
    {
        return $user->moneyCategories()->firstOrCreate(
            ['builtin_key' => 'charity'],
            ['name' => 'Charity', 'type' => MoneyCategoryType::Expense],
        );
    }
}
