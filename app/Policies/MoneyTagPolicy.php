<?php

namespace App\Policies;

use App\Models\MoneyTag;
use App\Models\User;

class MoneyTagPolicy
{
    public function update(User $user, MoneyTag $tag): bool
    {
        return $tag->user_id === $user->id;
    }

    public function delete(User $user, MoneyTag $tag): bool
    {
        return $tag->user_id === $user->id;
    }
}
