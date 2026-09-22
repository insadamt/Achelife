<?php

namespace App\Support\Tasks;

use App\Data\Tasks\TaskSearchData;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaskSearchViewDataFactory
{
    public function __construct(private readonly TaskViewDataFactory $taskViewDataFactory) {}

    /** @return LengthAwarePaginator<int, array<string, mixed>>|null */
    public function make(
        User $user,
        TaskSearchData $filters,
        CarbonImmutable $today,
        ?int $currentSeasonId,
    ): ?LengthAwarePaginator {
        if (! $filters->active()) {
            return null;
        }

        return $user->tasks()->visibleInWorkspace()
            ->with(['series', 'subtasks', 'reschedules', 'rewardSeason', 'project', 'user', 'completedFocusSessions.intervals'])
            ->when($filters->query !== '', function ($query) use ($filters): void {
                $pattern = '%'.$this->escapeLikePattern(mb_strtolower($filters->query)).'%';
                $query->where(function ($query) use ($pattern): void {
                    $query->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", [$pattern])
                        ->orWhereRaw("LOWER(COALESCE(notes, '')) LIKE ? ESCAPE '!'", [$pattern]);
                });
            })
            ->when($filters->status === 'incomplete', fn ($query) => $query->whereNull('completed_at'))
            ->when($filters->status === 'completed', fn ($query) => $query->whereNotNull('completed_at'))
            ->when($filters->project === 'inbox', fn ($query) => $query->whereNull('task_project_id'))
            ->when(ctype_digit($filters->project), fn ($query) => $query->where('task_project_id', (int) $filters->project))
            ->when($filters->important === 'yes', fn ($query) => $query->where('important', true))
            ->when($filters->important === 'no', fn ($query) => $query->where('important', false))
            ->orderBy('scheduled_date')
            ->orderByDesc('important')
            ->orderBy('id')
            ->paginate(25, ['*'], 'search_page')
            ->withQueryString()
            ->through(fn (Task $task) => $this->taskViewDataFactory->make($task, $today, $currentSeasonId));
    }

    private function escapeLikePattern(string $value): string
    {
        return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value);
    }
}
