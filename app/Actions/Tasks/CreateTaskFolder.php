<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\TaskFolderData;
use App\Models\TaskFolder;
use App\Models\User;
use App\Services\Tasks\TaskPositionService;

class CreateTaskFolder
{
    public function __construct(private readonly TaskPositionService $positions) {}

    public function execute(User $user, TaskFolderData $data): TaskFolder
    {
        return $user->taskFolders()->create([
            'name' => $data->name,
            'position' => $this->positions->nextFolderPosition($user),
        ]);
    }
}
