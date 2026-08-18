<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;
use Illuminate\Validation\ValidationException;

class DeleteUnusedMoneyAccount
{
    public function execute(MoneyAccount $account): void
    {
        if ($account->transactions()->exists() || $account->incomingTransfers()->exists()) {
            throw ValidationException::withMessages(['account' => 'Accounts with financial history cannot be deleted. Archive this Account instead.']);
        }

        $account->delete();
    }
}
