<?php

namespace App\Support\Tasks;

use App\Models\Task;
use App\Models\TaskFolder;
use App\Models\TaskProject;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class TaskWorkspaceViewDataFactory
{
    public function __construct(private readonly TaskViewDataFactory $taskViewDataFactory) {}

    /** @return array<string, mixed> */
    public function make(
        User $user,
        string $requestedView,
        ?int $requestedProjectId,
        ?int $requestedFolderId,
        string $requestedTaskView,
        CarbonImmutable $today,
        ?int $currentSeasonId,
    ): array {
        $view = in_array($requestedView, ['files', 'folder', 'today', 'inbox', 'upcoming', 'overdue', 'completed', 'project'], true)
            ? $requestedView
            : ($requestedView === '' ? 'files' : 'today');
        $folder = $view === 'folder' && $requestedFolderId !== null
            ? $user->taskFolders()->find($requestedFolderId)
            : null;
        $project = $view === 'project' && $requestedProjectId !== null
            ? $user->taskProjects()->with('folder')->find($requestedProjectId)
            : null;

        if ($view === 'folder' && ! $folder instanceof TaskFolder) {
            $view = 'files';
            $folder = null;
        }

        if ($view === 'project' && $project === null) {
            $view = 'inbox';
        }

        return [
            'view' => $view,
            'projectId' => $project?->id,
            'folderId' => $folder?->id ?? $project?->task_folder_id,
            'label' => $project?->name ?? $folder?->name ?? $this->smartViewLabel($view),
            'taskView' => $this->taskView($requestedTaskView, $view),
            'manualTasks' => $this->manualTasks($user, $view, $project, $today, $currentSeasonId),
        ];
    }

    /** @return Collection<int, array<string, mixed>>|null */
    private function manualTasks(
        User $user,
        string $view,
        ?TaskProject $project,
        CarbonImmutable $today,
        ?int $currentSeasonId,
    ): ?Collection {
        if (! in_array($view, ['inbox', 'project'], true)) {
            return null;
        }

        return $user->tasks()
            ->with(['series', 'subtasks', 'reschedules', 'rewardSeason', 'project', 'user', 'completedFocusSessions.intervals'])
            ->whereNull('completed_at')
            ->when(
                $view === 'project',
                fn ($query) => $query->where('task_project_id', $project?->id),
                fn ($query) => $query->whereNull('task_project_id'),
            )
            ->orderBy('position')
            ->orderBy('id')
            ->get()
            ->map(fn (Task $task) => $this->taskViewDataFactory->make($task, $today, $currentSeasonId));
    }

    private function smartViewLabel(string $view): string
    {
        return match ($view) {
            'files' => 'Files',
            'inbox' => 'Inbox',
            'upcoming' => 'Upcoming',
            'overdue' => 'Overdue',
            'completed' => 'Completed',
            default => 'Today',
        };
    }

    private function taskView(string $requestedTaskView, string $workspaceView): string
    {
        if (in_array($requestedTaskView, ['today', 'overdue', 'upcoming', 'completed'], true)) {
            return $requestedTaskView;
        }

        return in_array($workspaceView, ['today', 'overdue', 'upcoming', 'completed'], true)
            ? $workspaceView
            : 'today';
    }
}
