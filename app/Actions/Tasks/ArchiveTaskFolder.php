<?php

namespace App\Actions\Tasks;

use App\Models\TaskFolder;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class ArchiveTaskFolder
{
    public function __construct(private readonly TransitionTaskFocusSession $focusSessions) {}

    public function execute(User $user, TaskFolder $folder): void
    {
        if ($folder->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        DB::transaction(function () use ($user, $folder): void {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $lockedFolder = TaskFolder::query()->lockForUpdate()->findOrFail($folder->id);
            $archivedAt = now();

            $projects = $lockedFolder->projects()->with('tasks')->lockForUpdate()->get();

            foreach ($projects as $project) {
                foreach ($project->tasks as $task) {
                    $this->focusSessions->stopActiveForTask($task, CarbonImmutable::now('UTC'));
                }

                $project->update(['archived_at' => $archivedAt]);
            }

            $lockedFolder->update(['archived_at' => $archivedAt]);
        });
    }
}
