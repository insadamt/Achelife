<?php

namespace App\Actions\Money;

use App\Models\MoneyMerchant;
use App\Models\User;
use App\Support\Money\MoneyMerchantName;
use Illuminate\Validation\ValidationException;

class CreateMoneyMerchant
{
    public function __construct(private readonly MoneyMerchantName $merchantName) {}

    public function execute(User $user, string $name): MoneyMerchant
    {
        $displayName = $this->merchantName->display($name);
        $normalizedName = $this->merchantName->normalized($name);

        if ($user->moneyMerchants()->where('normalized_name', $normalizedName)->exists()) {
            throw ValidationException::withMessages(['name' => 'A Merchant with this name already exists.']);
        }

        return $user->moneyMerchants()->create([
            'name' => $displayName,
            'normalized_name' => $normalizedName,
        ]);
    }
}
