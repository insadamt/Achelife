<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateMoneyAccount
{
    public function execute(MoneyAccount $account, string $name, string $currency, int $initialBalanceMinor): MoneyAccount
    {
        return DB::transaction(function () use ($account, $name, $currency, $initialBalanceMinor): MoneyAccount {
            $lockedAccount = MoneyAccount::query()->lockForUpdate()->findOrFail($account->id);
            $hasHistory = $lockedAccount->transactions()->exists() || $lockedAccount->incomingTransfers()->exists();

            if ($hasHistory && strtoupper($currency) !== $lockedAccount->currency) {
                throw ValidationException::withMessages(['currency' => 'Currency is locked after an Account has transaction history.']);
            }

            if ($hasHistory && $initialBalanceMinor !== $lockedAccount->initial_balance_minor) {
                throw ValidationException::withMessages(['initial_balance' => 'Initial balance is locked after an Account has transaction history.']);
            }

            $lockedAccount->update([
                'name' => $name,
                'currency' => strtoupper($currency),
                'initial_balance_minor' => $initialBalanceMinor,
            ]);

            return $lockedAccount->refresh();
        }, 3);
    }
}
