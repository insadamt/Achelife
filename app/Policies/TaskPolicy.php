<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $user->is($task->user);
    }

    public function update(User $user, Task $task): bool
    {
        return $user->is($task->user);
    }

    public function complete(User $user, Task $task): bool
    {
        return $user->is($task->user);
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->is($task->user);
    }
}
