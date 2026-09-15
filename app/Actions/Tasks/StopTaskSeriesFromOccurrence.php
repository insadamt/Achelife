<?php

namespace App\Actions\Tasks;

use App\Models\Task;
use App\Models\TaskSeries;
use App\Services\Tasks\TaskPositionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StopTaskSeriesFromOccurrence
{
    public function __construct(private readonly TaskPositionService $positions) {}

    public function execute(Task $task): void
    {
        DB::transaction(function () use ($task): void {
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['task' => 'Completed Tasks cannot be deleted.']);
            }

            if ($lockedTask->task_series_id === null || $lockedTask->occurrence_date === null) {
                throw ValidationException::withMessages(['task' => 'This Task is not part of a recurring series.']);
            }

            $series = TaskSeries::query()->lockForUpdate()->findOrFail($lockedTask->task_series_id);
            $series->update(['ends_before' => $lockedTask->occurrence_date]);
            $tasksToDelete = $series->tasks()
                ->where('occurrence_date', '>=', $lockedTask->occurrence_date)
                ->whereNull('completed_at');
            $projectIds = $tasksToDelete->pluck('task_project_id')->unique();
            $tasksToDelete->delete();
            $user = $series->user()->firstOrFail();

            foreach ($projectIds as $projectId) {
                $this->positions->normalizeTasks($user, $projectId === null ? null : (int) $projectId);
            }
        });
    }
}
