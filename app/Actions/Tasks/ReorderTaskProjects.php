<?php

namespace App\Actions\Tasks;

use App\Models\User;
use App\Services\Tasks\TaskSiblingOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReorderTaskProjects
{
    public function __construct(private readonly TaskSiblingOrder $siblingOrder) {}

    /** @param list<int> $orderedIds */
    public function execute(User $user, ?int $folderId, array $orderedIds): void
    {
        DB::transaction(function () use ($user, $folderId, $orderedIds): void {
            $this->lockOwnedFolder($user, $folderId);
            $projects = $user->taskProjects()
                ->whereNull('archived_at')
                ->when($folderId === null, fn (Builder $query) => $query->whereNull('task_folder_id'))
                ->when($folderId !== null, fn (Builder $query) => $query->where('task_folder_id', $folderId))
                ->lockForUpdate()
                ->orderBy('position')
                ->orderBy('id')
                ->get();

            $this->siblingOrder->applyExactOrder($projects, $orderedIds, 'project_ids');
        });
    }

    private function lockOwnedFolder(User $user, ?int $folderId): void
    {
        if ($folderId !== null && $user->taskFolders()->whereNull('archived_at')->lockForUpdate()->find($folderId) === null) {
            throw ValidationException::withMessages(['task_folder_id' => 'The selected Folder is invalid.']);
        }
    }
}
