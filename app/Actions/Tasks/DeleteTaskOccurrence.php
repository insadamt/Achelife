<?php

namespace App\Actions\Tasks;

use App\Models\Task;
use App\Services\Tasks\TaskPositionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteTaskOccurrence
{
    public function __construct(private readonly TaskPositionService $positions) {}

    public function execute(Task $task): void
    {
        DB::transaction(function () use ($task): void {
            $lockedTask = Task::query()->with('series')->lockForUpdate()->findOrFail($task->id);

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['task' => 'Completed Tasks cannot be deleted.']);
            }

            if ($lockedTask->series !== null) {
                $lockedTask->series->exclusions()->firstOrCreate([
                    'occurrence_date' => $lockedTask->occurrence_date,
                ]);
            }

            $user = $lockedTask->user()->firstOrFail();
            $projectId = $lockedTask->task_project_id;
            $lockedTask->delete();
            $this->positions->normalizeTasks($user, $projectId);
        });
    }
}
