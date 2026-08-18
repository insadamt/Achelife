<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;
use App\Models\MoneyTransaction;
use Illuminate\Support\Facades\DB;

class DeleteMoneyTransaction
{
    public function execute(MoneyTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction): void {
            $lockedTransaction = MoneyTransaction::query()->lockForUpdate()->findOrFail($transaction->id);
            MoneyAccount::query()
                ->whereIn('id', array_filter([$lockedTransaction->account_id, $lockedTransaction->destination_account_id]))
                ->lockForUpdate()
                ->get();
            $lockedTransaction->delete();
        }, 3);
    }
}
