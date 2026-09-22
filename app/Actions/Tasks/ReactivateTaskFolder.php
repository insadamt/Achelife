<?php

namespace App\Actions\Tasks;

use App\Models\TaskFolder;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class ReactivateTaskFolder
{
    public function execute(User $user, TaskFolder $folder): void
    {
        if ($folder->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        DB::transaction(function () use ($folder): void {
            $lockedFolder = TaskFolder::query()->lockForUpdate()->findOrFail($folder->id);
            $lockedFolder->projects()->lockForUpdate()->update(['archived_at' => null]);
            $lockedFolder->update(['archived_at' => null]);
        });
    }
}
