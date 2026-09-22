<?php

namespace App\Actions\Tasks;

use App\Models\TaskProject;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class ArchiveTaskProject
{
    public function __construct(private readonly TransitionTaskFocusSession $focusSessions) {}

    public function execute(User $user, TaskProject $project): void
    {
        if ($project->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        DB::transaction(function () use ($user, $project): void {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $lockedProject = TaskProject::query()->with('tasks')->lockForUpdate()->findOrFail($project->id);

            foreach ($lockedProject->tasks as $task) {
                $this->focusSessions->stopActiveForTask($task, CarbonImmutable::now('UTC'));
            }

            $lockedProject->update(['archived_at' => now()]);
        });
    }
}
