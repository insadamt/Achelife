<?php

namespace App\Policies;

use App\Models\MoneyDebt;
use App\Models\User;

class MoneyDebtPolicy
{
    public function view(User $user, MoneyDebt $debt): bool
    {
        return $user->is($debt->user);
    }

    public function update(User $user, MoneyDebt $debt): bool
    {
        return $this->view($user, $debt);
    }

    public function delete(User $user, MoneyDebt $debt): bool
    {
        return $this->view($user, $debt);
    }
}
