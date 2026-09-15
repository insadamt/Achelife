<?php

namespace App\Actions\Tasks;

use App\Models\TaskProject;
use App\Models\User;
use App\Services\Tasks\TaskPositionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class DeleteTaskProject
{
    public function __construct(private readonly TaskPositionService $positions) {}

    public function execute(User $user, TaskProject $project): void
    {
        if ($project->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        DB::transaction(function () use ($user, $project): void {
            $lockedProject = TaskProject::query()->lockForUpdate()->findOrFail($project->id);
            $nextInboxPosition = $this->positions->nextTaskPosition($user, null);

            foreach ($lockedProject->tasks()->get() as $task) {
                $task->update([
                    'task_project_id' => null,
                    'position' => $nextInboxPosition++,
                ]);
            }

            $lockedProject->taskSeries()->update(['task_project_id' => null]);
            $folderId = $lockedProject->task_folder_id;
            $lockedProject->delete();

            $this->positions->normalizeTasks($user, null);
            $this->positions->normalizeProjects($user, $folderId);
        });
    }
}
