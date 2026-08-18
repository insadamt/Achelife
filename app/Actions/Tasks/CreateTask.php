<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\TaskData;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateTask
{
    public function __construct(private readonly SynchronizeRecurringTaskOccurrences $synchronizeOccurrences) {}

    public function execute(User $user, TaskData $data): Task
    {
        return DB::transaction(function () use ($user, $data): Task {
            if ($data->recurrenceType === null) {
                $task = $user->tasks()->create([
                    'title' => $data->title,
                    'scheduled_date' => $data->scheduledDate,
                    'important' => $data->important,
                ]);
                $this->createSubtasks($task, $data);

                return $task;
            }

            $series = $user->taskSeries()->create([
                'title' => $data->title,
                'important' => $data->important,
                'recurrence_type' => $data->recurrenceType,
                'weekdays' => $data->weekdays,
                'subtask_template' => array_map(fn ($subtask) => $subtask->title, $data->subtasks),
                'starts_on' => $data->scheduledDate,
            ]);

            $this->synchronizeOccurrences->synchronizeSeries(
                $series,
                now()->toImmutable()->startOfDay(),
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
}
