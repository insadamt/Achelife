<?php

namespace App\Actions\Tasks;

use App\Models\User;
use App\Services\Tasks\TaskSiblingOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReorderTasks
{
    public function __construct(private readonly TaskSiblingOrder $siblingOrder) {}

    /** @param list<int> $orderedIds */
    public function execute(User $user, ?int $projectId, array $orderedIds): void
    {
        DB::transaction(function () use ($user, $projectId, $orderedIds): void {
            $this->lockOwnedProject($user, $projectId);
            $tasks = $user->tasks()
                ->when($projectId === null, fn (Builder $query) => $query->whereNull('task_project_id'))
                ->when($projectId !== null, fn (Builder $query) => $query->where('task_project_id', $projectId))
                ->lockForUpdate()
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            $this->siblingOrder->applyExactOrder($tasks, $orderedIds, 'task_ids');
        });
    }

    private function lockOwnedProject(User $user, ?int $projectId): void
    {
        if ($projectId !== null && $user->taskProjects()->whereNull('archived_at')->lockForUpdate()->find($projectId) === null) {
            throw ValidationException::withMessages(['task_project_id' => 'The selected Project is invalid.']);
        }
    }
}
