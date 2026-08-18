<?php

namespace App\Policies;

use App\Models\MoneyAccount;
use App\Models\User;

class MoneyAccountPolicy
{
    public function view(User $user, MoneyAccount $account): bool
    {
        return $account->user_id === $user->id;
    }

    public function update(User $user, MoneyAccount $account): bool
    {
        return $account->user_id === $user->id;
    }

    public function delete(User $user, MoneyAccount $account): bool
    {
        return $account->user_id === $user->id;
    }
}
