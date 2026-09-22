<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\TaskFolderData;
use App\Models\TaskFolder;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class UpdateTaskFolder
{
    public function execute(User $user, TaskFolder $folder, TaskFolderData $data): TaskFolder
    {
        if ($folder->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $folder->update(['name' => $data->name, 'color' => $data->color]);

        return $folder->refresh();
    }
}
