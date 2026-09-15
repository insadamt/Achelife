<?php

namespace App\Actions\Tasks;

use App\Enums\TaskFocusSessionSource;
use App\Enums\TaskFocusSessionState;
use App\Exceptions\ActiveTaskFocusSessionExists;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StartTaskFocusSession
{
    public function execute(User $user, Task $task, ?CarbonImmutable $startedAt = null): TaskFocusSession
    {
        if ($task->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $startedAt = ($startedAt ?? CarbonImmutable::now('UTC'))->utc();

        try {
            return DB::transaction(function () use ($user, $task, $startedAt): TaskFocusSession {
                User::query()->lockForUpdate()->findOrFail($user->id);
                $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);

                if ($lockedTask->completed_at !== null) {
                    throw ValidationException::withMessages(['focus' => 'Completed Tasks cannot start a Focus Session.']);
                }

                $activeSession = $user->taskFocusSessions()->where('active_marker', 1)->lockForUpdate()->first();

                if ($activeSession !== null) {
                    throw new ActiveTaskFocusSessionExists($activeSession);
                }

                $session = $user->taskFocusSessions()->create([
                    'task_id' => $lockedTask->id,
                    'started_at' => $startedAt,
                    'accumulated_seconds' => 0,
                    'state' => TaskFocusSessionState::Running,
                    'source' => TaskFocusSessionSource::Timer,
                    'active_marker' => 1,
                ]);
                $session->intervals()->create(['started_at' => $startedAt]);

                return $session->load(['task.project', 'intervals']);
            }, 3);
        } catch (QueryException $exception) {
            $activeSession = $user->taskFocusSessions()->where('active_marker', 1)->first();

            if ($activeSession !== null) {
                throw new ActiveTaskFocusSessionExists($activeSession->load(['task.project', 'intervals']));
            }

            throw $exception;
        }
    }
}
