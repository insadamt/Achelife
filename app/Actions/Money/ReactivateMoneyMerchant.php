<?php

namespace App\Actions\Money;

use App\Models\MoneyMerchant;

class ReactivateMoneyMerchant
{
    public function execute(MoneyMerchant $merchant): MoneyMerchant
    {
        $merchant->update(['archived_at' => null]);

        return $merchant->refresh();
    }
}
