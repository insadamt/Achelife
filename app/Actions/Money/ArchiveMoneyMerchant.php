<?php

namespace App\Actions\Money;

use App\Models\MoneyMerchant;

class ArchiveMoneyMerchant
{
    public function execute(MoneyMerchant $merchant): MoneyMerchant
    {
        $merchant->update(['archived_at' => now()]);

        return $merchant->refresh();
    }
}
