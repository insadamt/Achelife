<?php

namespace App\Actions\Money;

use App\Enums\MoneyCategoryType;
use App\Models\MoneyCategory;
use App\Models\User;

class CreateMoneyCategory
{
    public function execute(User $user, string $name, MoneyCategoryType $type): MoneyCategory
    {
        return $user->moneyCategories()->create(['name' => $name, 'type' => $type]);
    }
}
