<?php

namespace App\Policies;

use App\Models\MoneySubscriptionOccurrence;
use App\Models\User;

class MoneySubscriptionOccurrencePolicy
{
    public function update(User $user, MoneySubscriptionOccurrence $occurrence): bool
    {
        return $user->id === $occurrence->user_id;
    }
}
