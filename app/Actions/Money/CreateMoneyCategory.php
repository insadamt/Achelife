<?php

namespace App\Actions\Money;

use App\Enums\MoneyCategoryType;
use App\Models\MoneyCategory;
use App\Models\User;
use App\Services\Money\MoneyCategoryColorService;

class CreateMoneyCategory
{
    public function __construct(private readonly MoneyCategoryColorService $colors) {}

    public function execute(User $user, string $name, MoneyCategoryType $type, ?string $color = null): MoneyCategory
    {
        return $user->moneyCategories()->create([
            'name' => $name,
            'type' => $type,
            'color' => $this->colors->uniqueColor($user, $type, $color),
        ]);
    }
}
