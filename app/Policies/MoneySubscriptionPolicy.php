<?php

namespace App\Policies;

use App\Models\MoneySubscription;
use App\Models\User;

class MoneySubscriptionPolicy
{
    public function update(User $user, MoneySubscription $subscription): bool
    {
        return $user->id === $subscription->user_id;
    }

    public function delete(User $user, MoneySubscription $subscription): bool
    {
        return $user->id === $subscription->user_id;
    }
}
