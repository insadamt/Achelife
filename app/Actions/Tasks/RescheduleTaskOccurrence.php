<?php

namespace App\Actions\Tasks;

use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RescheduleTaskOccurrence
{
    public function execute(Task $task, CarbonImmutable $scheduledDate): Task
    {
        return DB::transaction(function () use ($task, $scheduledDate): Task {
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['task' => 'Completed Tasks cannot be rescheduled.']);
            }

            if ($lockedTask->scheduled_date->isSameDay($scheduledDate)) {
                return $lockedTask;
            }

            $lockedTask->reschedules()->create([
                'from_date' => $lockedTask->scheduled_date,
                'to_date' => $scheduledDate,
                'rescheduled_at' => now(),
            ]);
            $lockedTask->update(['scheduled_date' => $scheduledDate]);

            return $lockedTask->refresh();
        });
    }
}
