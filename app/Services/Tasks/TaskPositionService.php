<?php

namespace App\Services\Tasks;

use App\Models\Task;
use App\Models\TaskProject;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class TaskPositionService
{
    public function nextFolderPosition(User $user): int
    {
        return $this->nextPosition($user->taskFolders()->max('position'));
    }

    public function nextProjectPosition(User $user, ?int $folderId): int
    {
        return $this->nextPosition($this->projectsIn($user, $folderId)->max('position'));
    }

    public function nextTaskPosition(User $user, ?int $projectId): int
    {
        return $this->nextPosition($this->tasksIn($user, $projectId)->max('position'));
    }

    public function normalizeProjects(User $user, ?int $folderId): void
    {
        $this->normalize($this->projectsIn($user, $folderId));
    }

    public function normalizeFolders(User $user): void
    {
        $this->normalize($user->taskFolders()->getQuery());
    }

    public function normalizeTasks(User $user, ?int $projectId): void
    {
        $this->normalize($this->tasksIn($user, $projectId));
    }

    /** @return Builder<TaskProject> */
    private function projectsIn(User $user, ?int $folderId): Builder
    {
        return $user->taskProjects()->getQuery()
            ->when($folderId === null, fn (Builder $query) => $query->whereNull('task_folder_id'))
            ->when($folderId !== null, fn (Builder $query) => $query->where('task_folder_id', $folderId));
    }

    /** @return Builder<Task> */
    private function tasksIn(User $user, ?int $projectId): Builder
    {
        return $user->tasks()->getQuery()
            ->when($projectId === null, fn (Builder $query) => $query->whereNull('task_project_id'))
            ->when($projectId !== null, fn (Builder $query) => $query->where('task_project_id', $projectId));
    }

    /** @param Builder<*> $query */
    private function normalize(Builder $query): void
    {
        foreach ($query->orderBy('position')->orderBy('id')->get() as $position => $model) {
            if ($model->position !== $position) {
                $model->update(['position' => $position]);
            }
        }
    }

    private function nextPosition(mixed $maximum): int
    {
        return $maximum === null ? 0 : ((int) $maximum) + 1;
    }
}
