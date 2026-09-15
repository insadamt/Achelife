<?php

namespace App\Support\Tasks;

use App\Enums\TaskFocusSessionState;
use App\Models\TaskFocusSession;
use App\Services\Tasks\TaskFocusSessionTimer;
use Carbon\CarbonImmutable;

class TaskFocusSessionViewDataFactory
{
    public function __construct(private readonly TaskFocusSessionTimer $timer) {}

    /** @return array<string, mixed> */
    public function make(TaskFocusSession $session, ?CarbonImmutable $at = null): array
    {
        $at = ($at ?? CarbonImmutable::now('UTC'))->utc();
        $session->loadMissing(['user', 'task.project', 'intervals']);
        $openInterval = $session->intervals->firstWhere('ended_at', null);

        return [
            'id' => $session->id,
            'taskId' => $session->task_id,
            'taskTitle' => $session->task->title,
            'projectName' => $session->task->project?->name,
            'state' => $session->state->value,
            'source' => $session->source->value,
            'timezone' => $session->user->timezone,
            'startedAt' => $session->started_at->toIso8601String(),
            'endedAt' => $session->ended_at?->toIso8601String(),
            'accumulatedSeconds' => $session->accumulated_seconds,
            'openIntervalStartedAt' => $openInterval?->started_at->toIso8601String(),
            'elapsedSeconds' => $this->timer->elapsedSeconds($session, $at),
            'serverTimestamp' => $at->toIso8601String(),
            'active' => $session->active_marker === 1,
            'running' => $session->state === TaskFocusSessionState::Running,
        ];
    }
}
