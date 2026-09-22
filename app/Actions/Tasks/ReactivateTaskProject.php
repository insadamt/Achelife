<?php

namespace App\Actions\Tasks;

use App\Models\TaskProject;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

class ReactivateTaskProject
{
    public function execute(User $user, TaskProject $project): void
    {
        if ($project->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        if ($project->task_folder_id !== null && $project->folder?->archived_at !== null) {
            throw ValidationException::withMessages(['task_project' => 'Reactivate the containing Folder first.']);
        }

        $project->update(['archived_at' => null]);
    }
}
