<?php

namespace App\Policies;

use App\Models\TaskFocusSession;
use App\Models\User;

class TaskFocusSessionPolicy
{
    public function delete(User $user, TaskFocusSession $session): bool
    {
        return $session->user_id === $user->id;
    }
}
