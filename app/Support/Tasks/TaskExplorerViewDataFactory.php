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
        $folders = $user->taskFolders()
            ->with(['projects' => fn ($query) => $query->withCount($this->openTaskCount())])
            ->orderBy('position')
            ->orderBy('id')
            ->get();
        $rootProjects = $user->taskProjects()
            ->whereNull('task_folder_id')
            ->withCount($this->openTaskCount())
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        return [
            'folders' => $folders->map(fn ($folder) => [
                'id' => $folder->id,
                'name' => $folder->name,
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
        ];
    }

    /** @return array<string, mixed> */
    private function projectData(TaskProject $project): array
    {
        return [
            'id' => $project->id,
            'name' => $project->name,
            'position' => $project->position,
            'openTaskCount' => $project->open_task_count,
        ];
    }

    /** @return array<string, callable(Builder): void> */
    private function openTaskCount(): array
    {
        return ['tasks as open_task_count' => fn (Builder $query) => $query->whereNull('completed_at')];
    }
}
