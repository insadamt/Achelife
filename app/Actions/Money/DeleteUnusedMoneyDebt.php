<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;
use App\Models\MoneyDebt;
use App\Models\MoneyTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteUnusedMoneyDebt
{
    public function execute(MoneyDebt $debt): void
    {
        DB::transaction(function () use ($debt): void {
            $lockedDebt = MoneyDebt::query()->lockForUpdate()->findOrFail($debt->id);

            if ($lockedDebt->settlements()->lockForUpdate()->exists()) {
                throw ValidationException::withMessages(['debt' => 'A debt with settlement history cannot be deleted.']);
            }

            $transaction = $lockedDebt->opening_transaction_id === null
                ? null
                : MoneyTransaction::query()->lockForUpdate()->findOrFail($lockedDebt->opening_transaction_id);

            if ($transaction !== null) {
                MoneyAccount::query()->whereKey($transaction->account_id)->lockForUpdate()->firstOrFail();
            }

            $lockedDebt->delete();
            $transaction?->delete();
        }, 3);
    }
}
