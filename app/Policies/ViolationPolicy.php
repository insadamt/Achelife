<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Violation;

class ViolationPolicy
{
    public function update(User $user, Violation $violation): bool
    {
        return $violation->user_id === $user->id;
    }

    public function delete(User $user, Violation $violation): bool
    {
        return $violation->user_id === $user->id;
    }
}
