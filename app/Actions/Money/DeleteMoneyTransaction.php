<?php

namespace App\Actions\Money;

use App\Enums\MoneySubscriptionOccurrenceStatus;
use App\Models\MoneyAccount;
use App\Models\MoneySubscriptionOccurrence;
use App\Models\MoneyTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteMoneyTransaction
{
    public function execute(MoneyTransaction $transaction): void
    {
        DB::transaction(function () use ($transaction): void {
            $lockedTransaction = MoneyTransaction::query()->lockForUpdate()->findOrFail($transaction->id);
            if ($lockedTransaction->openedDebt()->exists() || $lockedTransaction->debtSettlement()->exists()) {
                throw ValidationException::withMessages([
                    'transaction' => 'Delete this movement from Debts so the outstanding balance and Account stay consistent.',
                ]);
            }
            MoneyAccount::query()
                ->whereIn('id', array_filter([$lockedTransaction->account_id, $lockedTransaction->destination_account_id]))
                ->lockForUpdate()
                ->get();
            MoneySubscriptionOccurrence::query()
                ->where('transaction_id', $lockedTransaction->id)
                ->lockForUpdate()
                ->update([
                    'status' => MoneySubscriptionOccurrenceStatus::Due,
                    'transaction_id' => null,
                    'paid_at' => null,
                    'automatic_retry_blocked_at' => now(),
                ]);
            $lockedTransaction->delete();
        }, 3);
    }
}
