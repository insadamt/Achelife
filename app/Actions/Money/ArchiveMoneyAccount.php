<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;

class ArchiveMoneyAccount
{
    public function execute(MoneyAccount $account): MoneyAccount
    {
        $account->update(['archived_at' => now()]);

        return $account->refresh();
    }
}
