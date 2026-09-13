<?php

namespace App\Actions\Money;

use App\Models\MoneyMerchant;
use App\Support\Money\MoneyMerchantName;
use Illuminate\Validation\ValidationException;

class UpdateMoneyMerchant
{
    public function __construct(private readonly MoneyMerchantName $merchantName) {}

    public function execute(MoneyMerchant $merchant, string $name): MoneyMerchant
    {
        $displayName = $this->merchantName->display($name);
        $normalizedName = $this->merchantName->normalized($name);
        $duplicateExists = MoneyMerchant::query()
            ->where('user_id', $merchant->user_id)
            ->where('normalized_name', $normalizedName)
            ->whereKeyNot($merchant->id)
            ->exists();

        if ($duplicateExists) {
            throw ValidationException::withMessages(['name' => 'A Merchant with this name already exists.']);
        }

        $merchant->update(['name' => $displayName, 'normalized_name' => $normalizedName]);

        return $merchant->refresh();
    }
}
