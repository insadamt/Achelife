<?php

namespace App\Actions\Tasks;

use App\Enums\TaskFocusSessionState;
use App\Enums\TaskFocusTransition;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Models\User;
use App\Services\Tasks\TaskFocusSessionTimer;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransitionTaskFocusSession
{
    public function __construct(private readonly TaskFocusSessionTimer $timer) {}

    public function execute(
        User $user,
        TaskFocusSession $session,
        TaskFocusTransition $transition,
        ?CarbonImmutable $transitionedAt = null,
    ): TaskFocusSession {
        if ($session->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $transitionedAt = ($transitionedAt ?? CarbonImmutable::now('UTC'))->utc();

        return DB::transaction(function () use ($user, $session, $transition, $transitionedAt): TaskFocusSession {
            User::query()->lockForUpdate()->findOrFail($user->id);
            Task::query()->lockForUpdate()->findOrFail($session->task_id);
            $lockedSession = TaskFocusSession::query()->lockForUpdate()->findOrFail($session->id);

            return match ($transition) {
                TaskFocusTransition::Pause => $this->pause($lockedSession, $transitionedAt),
                TaskFocusTransition::Resume => $this->resume($lockedSession, $transitionedAt),
                TaskFocusTransition::Stop => $this->stop($lockedSession, $transitionedAt),
            };
        }, 3);
    }

    public function stopActiveForTask(Task $lockedTask, CarbonImmutable $stoppedAt): void
    {
        $session = $lockedTask->focusSessions()
            ->where('active_marker', 1)
            ->lockForUpdate()
            ->first();

        if ($session !== null) {
            $this->stop($session, $stoppedAt->utc());
        }
    }

    private function pause(TaskFocusSession $session, CarbonImmutable $at): TaskFocusSession
    {
        if ($session->state === TaskFocusSessionState::Paused) {
            $this->ensureOpenIntervalCount($session, 0);

            return $this->loadResult($session);
        }

        $this->ensureState($session, TaskFocusSessionState::Running, 'pause');
        $session->update([
            'accumulated_seconds' => $session->accumulated_seconds + $this->timer->closeOpenInterval($session, $at),
            'state' => TaskFocusSessionState::Paused,
        ]);

        return $this->loadResult($session);
    }

    private function resume(TaskFocusSession $session, CarbonImmutable $at): TaskFocusSession
    {
        if ($session->state === TaskFocusSessionState::Running) {
            $this->ensureOpenIntervalCount($session, 1);

            return $this->loadResult($session);
        }

        $this->ensureState($session, TaskFocusSessionState::Paused, 'resume');

        if ($session->intervals()->whereNull('ended_at')->exists()) {
            throw ValidationException::withMessages(['focus' => 'The paused Focus Session has an open interval.']);
        }

        $session->intervals()->create(['started_at' => $at]);
        $session->update(['state' => TaskFocusSessionState::Running]);

        return $this->loadResult($session);
    }

    private function stop(TaskFocusSession $session, CarbonImmutable $at): TaskFocusSession
    {
        if ($session->state === TaskFocusSessionState::Completed) {
            if ($session->active_marker !== null) {
                throw ValidationException::withMessages(['focus' => 'The completed Focus Session is still marked active.']);
            }

            $this->ensureOpenIntervalCount($session, 0);

            return $this->loadResult($session);
        }

        $seconds = $session->state === TaskFocusSessionState::Running
            ? $this->timer->closeOpenInterval($session, $at)
            : 0;
        $session->update([
            'accumulated_seconds' => $session->accumulated_seconds + $seconds,
            'state' => TaskFocusSessionState::Completed,
            'ended_at' => $at,
            'active_marker' => null,
        ]);

        return $this->loadResult($session);
    }

    private function ensureState(TaskFocusSession $session, TaskFocusSessionState $expected, string $transition): void
    {
        if ($session->state !== $expected) {
            throw ValidationException::withMessages(['focus' => "This Focus Session cannot {$transition} from its current state."]);
        }
    }

    private function ensureOpenIntervalCount(TaskFocusSession $session, int $expected): void
    {
        if ($session->intervals()->whereNull('ended_at')->count() !== $expected) {
            throw ValidationException::withMessages(['focus' => 'The Focus Session has invalid interval state.']);
        }
    }

    private function loadResult(TaskFocusSession $session): TaskFocusSession
    {
        return $session->refresh()->load(['task.project', 'intervals']);
    }
}
