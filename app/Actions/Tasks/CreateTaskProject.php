<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\TaskProjectData;
use App\Models\TaskProject;
use App\Models\User;
use App\Services\Tasks\TaskPositionService;
use Illuminate\Validation\ValidationException;

class CreateTaskProject
{
    public function __construct(private readonly TaskPositionService $positions) {}

    public function execute(User $user, TaskProjectData $data): TaskProject
    {
        $this->ensureFolderBelongsToUser($user, $data->folderId);

        return $user->taskProjects()->create([
            'task_folder_id' => $data->folderId,
            'name' => $data->name,
            'color' => $data->color,
            'position' => $this->positions->nextProjectPosition($user, $data->folderId),
        ]);
    }

    private function ensureFolderBelongsToUser(User $user, ?int $folderId): void
    {
        if ($folderId !== null && ! $user->taskFolders()->whereKey($folderId)->whereNull('archived_at')->exists()) {
            throw ValidationException::withMessages(['task_folder_id' => 'The selected Folder is invalid.']);
        }
    }
}
