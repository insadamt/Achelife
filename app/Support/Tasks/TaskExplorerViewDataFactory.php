<?php

namespace App\Support\Tasks;

use App\Models\TaskProject;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class TaskExplorerViewDataFactory
{
    /** @return array<string, mixed> */
    public function make(User $user): array
    {
        $folders = $user->taskFolders()->whereNull('archived_at')
            ->with(['projects' => fn ($query) => $query->whereNull('archived_at')->withCount($this->openTaskCount())])
            ->orderBy('position')
            ->orderBy('id')
            ->get();
        $rootProjects = $user->taskProjects()
            ->whereNull('task_folder_id')
            ->whereNull('archived_at')
            ->withCount($this->openTaskCount())
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return [
            'folders' => $folders->map(fn ($folder) => [
                'id' => $folder->id,
                'name' => $folder->name,
                'color' => $folder->color,
                'position' => $folder->position,
                'projectCount' => $folder->projects->count(),
                'openTaskCount' => $folder->projects->sum('open_task_count'),
                'projects' => $folder->projects->map($this->projectData(...))->values(),
            ])->values(),
            'rootProjects' => $rootProjects->map($this->projectData(...))->values(),
            'inboxCount' => $user->tasks()
                ->whereNull('task_project_id')
                ->whereNull('completed_at')
                ->count(),
            'archivedFolders' => $user->taskFolders()
                ->whereNotNull('archived_at')
                ->with(['projects' => fn ($query) => $query->withCount($this->allTaskCount())])
                ->orderByDesc('archived_at')
                ->get()
                ->map($this->folderData(...))
                ->values(),
            'archivedProjects' => $user->taskProjects()
                ->whereNotNull('archived_at')
                ->where(function ($query): void {
                    $query->whereNull('task_folder_id')->orWhereHas('folder', fn ($query) => $query->whereNull('archived_at'));
                })
                ->withCount($this->allTaskCount())
                ->orderByDesc('archived_at')
                ->get()
                ->map($this->projectData(...))
                ->values(),
        ];
    }

    /** @return array<string, mixed> */
    private function folderData($folder): array
    {
        return [
            'id' => $folder->id,
            'name' => $folder->name,
            'color' => $folder->color,
            'position' => $folder->position,
            'projectCount' => $folder->projects->count(),
            'openTaskCount' => $folder->projects->sum(fn (TaskProject $project) => $project->open_task_count ?? $project->tasks_count),
            'projects' => $folder->projects->map($this->projectData(...))->values(),
        ];
    }

    /** @return array<string, mixed> */
    private function projectData(TaskProject $project): array
    {
        return [
            'id' => $project->id,
            'name' => $project->name,
            'color' => $project->color,
            'position' => $project->position,
            'openTaskCount' => $project->open_task_count ?? $project->tasks_count,
        ];
    }

    /** @return array<string, callable(Builder): void> */
    private function openTaskCount(): array
    {
        return ['tasks as open_task_count' => fn (Builder $query) => $query->whereNull('completed_at')];
    }

    /** @return array<int, string> */
    private function allTaskCount(): array
    {
        return ['tasks'];
    }
}
