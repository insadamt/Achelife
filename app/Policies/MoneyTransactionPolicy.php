<?php

namespace App\Policies;

use App\Models\MoneyTransaction;
use App\Models\User;

class MoneyTransactionPolicy
{
    public function update(User $user, MoneyTransaction $transaction): bool
    {
        return $transaction->user_id === $user->id;
    }

    public function delete(User $user, MoneyTransaction $transaction): bool
    {
        return $transaction->user_id === $user->id;
    }
}
