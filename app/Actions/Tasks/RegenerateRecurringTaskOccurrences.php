<?php

namespace App\Actions\Tasks;

use App\Models\Task;
use App\Services\Calendar\UserCalendar;
use App\Services\Tasks\TaskPositionService;

class RegenerateRecurringTaskOccurrences
{
    public function __construct(
        private readonly SynchronizeRecurringTaskOccurrences $synchronizeOccurrences,
        private readonly UserCalendar $userCalendar,
        private readonly TaskPositionService $positions,
    ) {}

    public function execute(Task $task): void
    {
        $series = $task->series;

        if ($series === null || $task->occurrence_date === null) {
            return;
        }

        $futureTasks = $series->tasks()
            ->where('occurrence_date', '>', $task->occurrence_date)
            ->whereNull('completed_at');
        $affectedProjectIds = $futureTasks->pluck('task_project_id')->unique();
        $futureTasks->delete();
        $user = $task->user()->firstOrFail();

        foreach ($affectedProjectIds as $projectId) {
            $this->positions->normalizeTasks($user, $projectId === null ? null : (int) $projectId);
        }

        $this->synchronizeOccurrences->synchronizeSeries(
            $series->refresh(),
            $this->userCalendar->today($user),
        );
    }
}
