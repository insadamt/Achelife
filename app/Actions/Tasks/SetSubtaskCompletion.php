<?php

namespace App\Actions\Tasks;

use App\Models\Subtask;
use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SetSubtaskCompletion
{
    public function execute(Task $task, Subtask $subtask, bool $completed): Subtask
    {
        return DB::transaction(function () use ($task, $subtask, $completed): Subtask {
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);
            $lockedSubtask = Subtask::query()->lockForUpdate()->findOrFail($subtask->id);

            if ($lockedSubtask->task_id !== $lockedTask->id) {
                throw ValidationException::withMessages(['subtask' => 'The subtask does not belong to this Task.']);
            }

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['task' => 'Completed Tasks are read-only.']);
            }

            $lockedSubtask->update(['completed_at' => $completed ? now() : null]);

            return $lockedSubtask->refresh();
        });
    }
}
