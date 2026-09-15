<?php

namespace App\Actions\Tasks;

use App\Models\TaskFolder;
use App\Models\User;
use App\Services\Tasks\TaskPositionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class DeleteTaskFolder
{
    public function __construct(private readonly TaskPositionService $positions) {}

    public function execute(User $user, TaskFolder $folder): void
    {
        if ($folder->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        DB::transaction(function () use ($user, $folder): void {
            $lockedFolder = TaskFolder::query()->lockForUpdate()->findOrFail($folder->id);
            $nextRootPosition = $this->positions->nextProjectPosition($user, null);

            foreach ($lockedFolder->projects()->get() as $project) {
                $project->update([
                    'task_folder_id' => null,
                    'position' => $nextRootPosition++,
                ]);
            }

            $lockedFolder->delete();
            $this->positions->normalizeFolders($user);
            $this->positions->normalizeProjects($user, null);
        });
    }
}
