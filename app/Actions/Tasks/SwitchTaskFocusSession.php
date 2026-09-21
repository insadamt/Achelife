<?php

namespace App\Actions\Tasks;

use App\Enums\TaskFocusSessionSource;
use App\Enums\TaskFocusSessionState;
use App\Enums\TaskFocusTransition;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SwitchTaskFocusSession
{
    public function __construct(private readonly TransitionTaskFocusSession $transition) {}

    public function execute(User $user, Task $task, ?CarbonImmutable $switchedAt = null): TaskFocusSession
    {
        if ($task->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return DB::transaction(function () use ($user, $task, $switchedAt): TaskFocusSession {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $switchedAt = ($switchedAt ?? CarbonImmutable::now('UTC'))->utc();
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['focus' => 'Completed Tasks cannot start a Focus Session.']);
            }

            $runningSession = $user->taskFocusSessions()
                ->where('running_marker', 1)
                ->lockForUpdate()
                ->first();

            if ($runningSession?->task_id === $lockedTask->id) {
                return $runningSession->load(['task.project', 'intervals']);
            }

            if ($runningSession !== null) {
                $this->transition->execute($user, $runningSession, TaskFocusTransition::Pause, $switchedAt);
            }

            $targetSession = $user->taskFocusSessions()
                ->where('task_id', $lockedTask->id)
                ->where('active_marker', 1)
                ->lockForUpdate()
                ->first();

            if ($targetSession !== null) {
                return $this->transition->execute($user, $targetSession, TaskFocusTransition::Resume, $switchedAt);
            }

            $session = $user->taskFocusSessions()->create([
                'task_id' => $lockedTask->id,
                'started_at' => $switchedAt,
                'accumulated_seconds' => 0,
                'state' => TaskFocusSessionState::Running,
                'source' => TaskFocusSessionSource::Timer,
                'active_marker' => 1,
                'running_marker' => 1,
            ]);
            $session->intervals()->create(['started_at' => $switchedAt]);

            return $session->load(['task.project', 'intervals']);
        }, 3);
    }
}
