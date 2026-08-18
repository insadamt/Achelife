<?php

namespace App\Policies;

use App\Models\Law;
use App\Models\User;

class LawPolicy
{
    public function view(User $user, Law $law): bool
    {
        return $law->user_id === $user->id;
    }

    public function update(User $user, Law $law): bool
    {
        return $law->user_id === $user->id;
    }

    public function delete(User $user, Law $law): bool
    {
        return $law->user_id === $user->id;
    }
}
