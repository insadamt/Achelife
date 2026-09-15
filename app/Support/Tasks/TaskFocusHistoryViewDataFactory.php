<?php

namespace App\Support\Tasks;

use App\Models\Task;
use App\Models\TaskFocusInterval;
use App\Models\TaskFocusSession;

class TaskFocusHistoryViewDataFactory
{
    /** @return array<string, mixed> */
    public function make(Task $task): array
    {
        $task->loadMissing(['user', 'completedFocusSessions.intervals']);
        $timezone = $task->user->timezone;

        return [
            'timezone' => $timezone,
            'totalSeconds' => $task->completedFocusSessions->sum(
                fn (TaskFocusSession $session): int => $this->intervalDuration($session),
            ),
            'sessions' => $task->completedFocusSessions->map(
                fn (TaskFocusSession $session): array => [
                    'id' => $session->id,
                    'source' => $session->source->value,
                    'startedAt' => $session->started_at->toIso8601String(),
                    'endedAt' => $session->ended_at?->toIso8601String(),
                    'localStartedAt' => $session->started_at->setTimezone($timezone)->format('Y-m-d\TH:i'),
                    'localEndedAt' => $session->ended_at?->setTimezone($timezone)->format('Y-m-d\TH:i'),
                    'durationSeconds' => $this->intervalDuration($session),
                    'intervalCount' => $session->intervals->count(),
                ],
            )->values(),
        ];
    }

    private function intervalDuration(TaskFocusSession $session): int
    {
        return $session->intervals->sum(
            fn (TaskFocusInterval $interval): int => $interval->started_at->diffInSeconds($interval->ended_at),
        );
    }
}
