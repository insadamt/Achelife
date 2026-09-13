<?php

namespace App\Actions\Money;

use App\Models\MoneyMerchant;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteUnusedMoneyMerchant
{
    public function execute(MoneyMerchant $merchant): void
    {
        DB::transaction(function () use ($merchant): void {
            $lockedMerchant = MoneyMerchant::query()->lockForUpdate()->findOrFail($merchant->id);

            if ($lockedMerchant->transactions()->exists()) {
                throw ValidationException::withMessages([
                    'merchant' => 'Merchants with transaction history cannot be deleted. Archive this Merchant instead.',
                ]);
            }

            $lockedMerchant->delete();
        }, 3);
    }
}
