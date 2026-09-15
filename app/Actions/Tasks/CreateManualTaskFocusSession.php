<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\ManualFocusSessionData;
use App\Enums\TaskFocusSessionSource;
use App\Enums\TaskFocusSessionState;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Models\User;
use App\Services\Tasks\TaskFocusIntervalIntegrity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class CreateManualTaskFocusSession
{
    public function __construct(private readonly TaskFocusIntervalIntegrity $integrity) {}

    public function execute(User $user, Task $task, ManualFocusSessionData $data): TaskFocusSession
    {
        if ($task->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return DB::transaction(function () use ($user, $task, $data): TaskFocusSession {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);
            $this->integrity->validate($user, $data);

            $session = $lockedTask->focusSessions()->create([
                'user_id' => $user->id,
                'started_at' => $data->startedAt,
                'ended_at' => $data->endedAt,
                'accumulated_seconds' => $data->startedAt->diffInSeconds($data->endedAt),
                'state' => TaskFocusSessionState::Completed,
                'source' => TaskFocusSessionSource::Manual,
            ]);
            $session->intervals()->create([
                'started_at' => $data->startedAt,
                'ended_at' => $data->endedAt,
            ]);

            return $session->load('intervals');
        }, 3);
    }
}
