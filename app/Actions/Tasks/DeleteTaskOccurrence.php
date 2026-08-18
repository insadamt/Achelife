<?php

namespace App\Actions\Tasks;

use App\Models\Task;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteTaskOccurrence
{
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

            $lockedTask->delete();
        });
    }
}
