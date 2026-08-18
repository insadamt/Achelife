<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;

class ReactivateMoneyAccount
{
    public function execute(MoneyAccount $account): MoneyAccount
    {
        $account->update(['archived_at' => null]);

        return $account->refresh();
    }
}
