<?php

namespace App\Policies;

use App\Models\TaskFolder;
use App\Models\User;

class TaskFolderPolicy
{
    public function update(User $user, TaskFolder $folder): bool
    {
        return $folder->user_id === $user->id;
    }

    public function delete(User $user, TaskFolder $folder): bool
    {
        return $folder->user_id === $user->id;
    }
}
