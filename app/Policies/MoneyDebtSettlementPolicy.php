<?php

namespace App\Policies;

use App\Models\MoneyDebtSettlement;
use App\Models\User;

class MoneyDebtSettlementPolicy
{
    public function delete(User $user, MoneyDebtSettlement $settlement): bool
    {
        return $user->is($settlement->user);
    }
}
