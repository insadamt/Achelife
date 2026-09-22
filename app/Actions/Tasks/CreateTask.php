<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\TaskData;
use App\Models\Task;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Tasks\TaskPositionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateTask
{
    public function __construct(
        private readonly SynchronizeRecurringTaskOccurrences $synchronizeOccurrences,
        private readonly UserCalendar $userCalendar,
        private readonly TaskPositionService $positions,
    ) {}

    public function execute(User $user, TaskData $data): Task
    {
        return DB::transaction(function () use ($user, $data): Task {
            $this->ensureProjectBelongsToUser($user, $data->projectId);

            if ($data->recurrenceType === null) {
                $task = $user->tasks()->create([
                    'task_project_id' => $data->projectId,
                    'title' => $data->title,
                    'notes' => $data->notes,
                    'position' => $this->positions->nextTaskPosition($user, $data->projectId),
                    'scheduled_date' => $data->scheduledDate,
                    'important' => $data->important,
                ]);
                $this->createSubtasks($task, $data);

                return $task;
            }

            $series = $user->taskSeries()->create([
                'task_project_id' => $data->projectId,
                'title' => $data->title,
                'notes' => $data->notes,
                'important' => $data->important,
                'recurrence_type' => $data->recurrenceType,
                'weekdays' => $data->weekdays,
                'subtask_template' => array_map(fn ($subtask) => $subtask->title, $data->subtasks),
                'starts_on' => $data->scheduledDate,
            ]);

            $this->synchronizeOccurrences->synchronizeSeries(
                $series,
                $this->userCalendar->today($user),
            );

            return $series->tasks()->orderBy('occurrence_date')->firstOrFail();
        });
    }

    private function createSubtasks(Task $task, TaskData $data): void
    {
        foreach ($data->subtasks as $position => $subtask) {
            $task->subtasks()->create(['title' => $subtask->title, 'position' => $position]);
        }
    }

    private function ensureProjectBelongsToUser(User $user, ?int $projectId): void
    {
        if ($projectId !== null && ! $user->taskProjects()->whereKey($projectId)->whereNull('archived_at')->exists()) {
            throw ValidationException::withMessages(['task_project_id' => 'The selected Project is invalid.']);
        }
    }
}
