<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\SubtaskData;
use App\Data\Tasks\TaskData;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateTask
{
    public function __construct(private readonly SynchronizeRecurringTaskOccurrences $synchronizeOccurrences) {}

    public function execute(Task $task, TaskData $data): Task
    {
        return DB::transaction(function () use ($task, $data): Task {
            $lockedTask = Task::query()->with(['series', 'subtasks'])->lockForUpdate()->findOrFail($task->id);
            $this->ensureEditable($lockedTask, $data);

            if (! $lockedTask->scheduled_date->isSameDay($data->scheduledDate)) {
                $lockedTask->reschedules()->create([
                    'from_date' => $lockedTask->scheduled_date,
                    'to_date' => $data->scheduledDate,
                    'rescheduled_at' => now(),
                ]);
            }

            $lockedTask->update([
                'title' => $data->title,
                'scheduled_date' => $data->scheduledDate,
                'important' => $data->important,
                ...($lockedTask->series === null ? [] : [
                    'recurrence_type_snapshot' => $data->recurrenceType,
                    'recurrence_weekdays_snapshot' => $data->weekdays,
                ]),
            ]);
            $this->synchronizeSubtasks($lockedTask, $data->subtasks);

            if ($lockedTask->series !== null) {
                $this->updateRecurringTemplateForward($lockedTask, $data);
            }

            return $lockedTask->refresh()->load(['series', 'subtasks', 'reschedules']);
        });
    }

    private function ensureEditable(Task $task, TaskData $data): void
    {
        if ($task->completed_at !== null) {
            throw ValidationException::withMessages(['task' => 'Completed Tasks are read-only.']);
        }

        if ($task->series !== null && $data->recurrenceType === null) {
            throw ValidationException::withMessages(['recurrence_type' => 'A recurring Task requires a recurrence pattern.']);
        }

        if ($task->series === null && $data->recurrenceType !== null) {
            throw ValidationException::withMessages(['recurrence_type' => 'A one-time Task cannot be converted into a recurring series.']);
        }
    }

    /** @param list<SubtaskData> $subtasks */
    private function synchronizeSubtasks(Task $task, array $subtasks): void
    {
        $retainedIds = [];
        $task->subtasks()->increment('position', 100);

        foreach ($subtasks as $position => $subtaskData) {
            $subtask = $subtaskData->id === null
                ? $task->subtasks()->make()
                : $task->subtasks->firstWhere('id', $subtaskData->id);

            if ($subtask === null) {
                $subtask = $task->subtasks()->make();
            }

            $subtask->fill(['title' => $subtaskData->title, 'position' => $position])->save();
            $retainedIds[] = $subtask->id;
        }

        $task->subtasks()->whereNotIn('id', $retainedIds)->delete();
    }

    private function updateRecurringTemplateForward(Task $task, TaskData $data): void
    {
        $series = $task->series;
        $occurrenceAnchor = $task->occurrence_date;

        $series->update([
            'title' => $data->title,
            'important' => $data->important,
            'recurrence_type' => $data->recurrenceType,
            'weekdays' => $data->weekdays,
            'subtask_template' => array_map(fn ($subtask) => $subtask->title, $data->subtasks),
            'materialized_through' => $occurrenceAnchor,
        ]);

        $series->tasks()
            ->where('occurrence_date', '>', $occurrenceAnchor)
            ->whereNull('completed_at')
            ->delete();

        $this->synchronizeOccurrences->synchronizeSeries($series->refresh(), CarbonImmutable::today());
    }
}
