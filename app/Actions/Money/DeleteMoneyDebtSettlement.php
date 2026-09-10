<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;
use App\Models\MoneyDebt;
use App\Models\MoneyDebtSettlement;
use App\Models\MoneyTransaction;
use Illuminate\Support\Facades\DB;

class DeleteMoneyDebtSettlement
{
    public function execute(MoneyDebtSettlement $settlement): void
    {
        DB::transaction(function () use ($settlement): void {
            $lockedSettlement = MoneyDebtSettlement::query()->lockForUpdate()->findOrFail($settlement->id);
            MoneyDebt::query()->whereKey($lockedSettlement->debt_id)->lockForUpdate()->firstOrFail();
            $transaction = $lockedSettlement->transaction_id === null
                ? null
                : MoneyTransaction::query()->lockForUpdate()->findOrFail($lockedSettlement->transaction_id);

            if ($transaction !== null) {
                MoneyAccount::query()->whereKey($transaction->account_id)->lockForUpdate()->firstOrFail();
            }

            $lockedSettlement->delete();
            $transaction?->delete();
        }, 3);
    }
}
