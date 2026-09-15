<?php

namespace App\Policies;

use App\Models\TaskProject;
use App\Models\User;

class TaskProjectPolicy
{
    public function update(User $user, TaskProject $project): bool
    {
        return $project->user_id === $user->id;
    }

    public function delete(User $user, TaskProject $project): bool
    {
        return $project->user_id === $user->id;
    }
}
