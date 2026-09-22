<?php

namespace App\Support\Tasks;

use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class TaskCalendarViewDataFactory
{
    public function __construct(private readonly TaskViewDataFactory $taskViewDataFactory) {}

    /** @param list<int> $projectIds
     *  @return Collection<int, array<string, mixed>>
     */
    public function make(User $user, CarbonImmutable $monthStart, CarbonImmutable $monthEnd, array $projectIds, bool $includeInbox, CarbonImmutable $today, ?int $currentSeasonId): Collection
    {
        return $user->tasks()->visibleInWorkspace()
            ->with(['series', 'subtasks', 'reschedules', 'rewardSeason', 'project', 'user', 'completedFocusSessions.intervals'])
            ->whereNull('completed_at')
            ->whereBetween('scheduled_date', [$monthStart, $monthEnd])
            ->where(function ($query) use ($projectIds, $includeInbox): void {
                if (! $includeInbox && $projectIds === []) {
                    $query->whereRaw('1 = 0');

                    return;
                }
                if ($includeInbox) {
                    $query->whereNull('task_project_id');
                }
                if ($projectIds !== []) {
                    $includeInbox ? $query->orWhereIn('task_project_id', $projectIds) : $query->whereIn('task_project_id', $projectIds);
                }
            })
            ->orderBy('scheduled_date')
            ->orderByDesc('important')
            ->orderBy('id')
            ->get()
            ->map(fn (Task $task) => $this->taskViewDataFactory->make($task, $today, $currentSeasonId));
    }
}
