<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\MoveTaskProjectData;
use App\Models\TaskProject;
use App\Models\User;
use App\Services\Tasks\TaskSiblingOrder;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MoveTaskProject
{
    public function __construct(private readonly TaskSiblingOrder $siblingOrder) {}

    public function execute(User $user, TaskProject $project, MoveTaskProjectData $data): TaskProject
    {
        if ($project->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return DB::transaction(function () use ($user, $project, $data): TaskProject {
            $this->lockOwnedDestinationFolder($user, $data->folderId);
            $projects = $user->taskProjects()->lockForUpdate()->orderBy('id')->get();
            $lockedProject = $projects->firstWhere('id', $project->id);

            if ($lockedProject === null) {
                throw new AuthorizationException;
            }

            $sourceFolderId = $lockedProject->task_folder_id;
            $destinationSiblings = $this->projectsIn($projects, $data->folderId, $lockedProject->id);
            $this->siblingOrder->ensurePositionIsBounded($data->position, $destinationSiblings->count());
            $lockedProject->update(['task_folder_id' => $data->folderId]);

            if ($sourceFolderId !== $data->folderId) {
                $this->siblingOrder->applyOrder($this->projectsIn($projects, $sourceFolderId, $lockedProject->id));
            }

            $destinationSiblings->splice($data->position, 0, [$lockedProject]);
            $this->siblingOrder->applyOrder($destinationSiblings);

            return $lockedProject->refresh();
        });
    }

    private function lockOwnedDestinationFolder(User $user, ?int $folderId): void
    {
        if ($folderId !== null && $user->taskFolders()->lockForUpdate()->find($folderId) === null) {
            throw ValidationException::withMessages(['task_folder_id' => 'The selected Folder is invalid.']);
        }
    }

    /** @param Collection<int, TaskProject> $projects
     * @return Collection<int, TaskProject>
     */
    private function projectsIn(Collection $projects, ?int $folderId, int $exceptProjectId): Collection
    {
        return $projects
            ->filter(fn (TaskProject $project): bool => $project->id !== $exceptProjectId
                && $project->task_folder_id === $folderId)
            ->sortBy([['position', 'asc'], ['id', 'asc']])
            ->values();
    }
}
