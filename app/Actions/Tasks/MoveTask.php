<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\MoveTaskData;
use App\Models\Task;
use App\Models\User;
use App\Services\Tasks\TaskSiblingOrder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MoveTask
{
    public function __construct(
        private readonly TaskSiblingOrder $siblingOrder,
        private readonly RegenerateRecurringTaskOccurrences $regenerateOccurrences,
    ) {}

    public function execute(User $user, Task $task, MoveTaskData $data): Task
    {
        if ($task->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return DB::transaction(function () use ($user, $task, $data): Task {
            $this->lockOwnedDestinationProject($user, $data->projectId);
            $tasks = $user->tasks()->lockForUpdate()->orderBy('id')->get();
            $lockedTask = $tasks->firstWhere('id', $task->id);

            if ($lockedTask === null) {
                throw new AuthorizationException;
            }

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['task' => 'Completed Tasks are read-only.']);
            }

            $sourceProjectId = $lockedTask->task_project_id;
            $destinationSiblings = $this->tasksIn($tasks, $data->projectId, $lockedTask->id);
            $this->siblingOrder->ensurePositionIsBounded($data->position, $destinationSiblings->count());
            $lockedTask->update(['task_project_id' => $data->projectId]);

            if ($sourceProjectId !== $data->projectId) {
                $this->siblingOrder->applyOrder($this->tasksIn($tasks, $sourceProjectId, $lockedTask->id));
            }

            $destinationSiblings->splice($data->position, 0, [$lockedTask]);
            $this->siblingOrder->applyOrder($destinationSiblings);

            $series = $lockedTask->series()->lockForUpdate()->first();

            if ($series !== null) {
                $series->update([
                    'task_project_id' => $data->projectId,
                    'materialized_through' => $lockedTask->occurrence_date,
                ]);
                $lockedTask->setRelation('series', $series);
                $this->regenerateOccurrences->execute($lockedTask);
            }

            return $lockedTask->refresh();
        });
    }

    private function lockOwnedDestinationProject(User $user, ?int $projectId): void
    {
        if ($projectId !== null && $user->taskProjects()->whereNull('archived_at')->lockForUpdate()->find($projectId) === null) {
            throw ValidationException::withMessages(['task_project_id' => 'The selected Project is invalid.']);
        }
    }

    /** @param Collection<int, Task> $tasks
     * @return Collection<int, Task>
     */
    private function tasksIn(Collection $tasks, ?int $projectId, int $exceptTaskId): Collection
    {
        return $tasks
            ->filter(fn (Task $task): bool => $task->id !== $exceptTaskId
                && $task->task_project_id === $projectId)
            ->sortBy([['position', 'asc'], ['id', 'asc']])
            ->values();
    }
}
