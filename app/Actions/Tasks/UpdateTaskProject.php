<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\TaskProjectData;
use App\Models\TaskProject;
use App\Models\User;
use App\Services\Tasks\TaskPositionService;
use App\Services\Tasks\TaskProjectColorService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateTaskProject
{
    public function __construct(private readonly TaskPositionService $positions, private readonly TaskProjectColorService $colors) {}

    public function execute(User $user, TaskProject $project, TaskProjectData $data): TaskProject
    {
        if ($project->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return DB::transaction(function () use ($user, $project, $data): TaskProject {
            $this->ensureFolderBelongsToUser($user, $data->folderId);
            $lockedProject = TaskProject::query()->lockForUpdate()->findOrFail($project->id);
            $previousFolderId = $lockedProject->task_folder_id;
            $folderChanged = $previousFolderId !== $data->folderId;

            $lockedProject->update([
                'name' => $data->name,
                'color' => $this->colors->uniqueColor($user, $data->color, $lockedProject->id),
                'task_folder_id' => $data->folderId,
                ...($folderChanged ? ['position' => $this->positions->nextProjectPosition($user, $data->folderId)] : []),
            ]);

            if ($folderChanged) {
                $this->positions->normalizeProjects($user, $previousFolderId);
                $this->positions->normalizeProjects($user, $data->folderId);
            }

            return $lockedProject->refresh();
        });
    }

    private function ensureFolderBelongsToUser(User $user, ?int $folderId): void
    {
        if ($folderId !== null && ! $user->taskFolders()->whereKey($folderId)->whereNull('archived_at')->exists()) {
            throw ValidationException::withMessages(['task_folder_id' => 'The selected Folder is invalid.']);
        }
    }
}
