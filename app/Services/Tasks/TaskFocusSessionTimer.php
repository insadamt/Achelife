<?php

namespace App\Services\Tasks;

use App\Models\TaskFocusInterval;
use App\Models\TaskFocusSession;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class TaskFocusSessionTimer
{
    public function elapsedSeconds(TaskFocusSession $session, CarbonImmutable $at): int
    {
        $seconds = $session->accumulated_seconds;
        $openInterval = $session->intervals->firstWhere('ended_at', null);

        return $openInterval === null
            ? $seconds
            : $seconds + $this->secondsBetween($openInterval->started_at, $at);
    }

    public function closeOpenInterval(TaskFocusSession $session, CarbonImmutable $at): int
    {
        $openIntervals = $session->intervals()->whereNull('ended_at')->lockForUpdate()->get();

        if ($openIntervals->count() !== 1) {
            throw ValidationException::withMessages(['focus' => 'The running Focus Session has invalid interval state.']);
        }

        /** @var TaskFocusInterval $interval */
        $interval = $openIntervals->sole();
        $seconds = $this->secondsBetween($interval->started_at, $at);
        $interval->update(['ended_at' => $at]);

        return $seconds;
    }

    private function secondsBetween(CarbonImmutable $startedAt, CarbonImmutable $endedAt): int
    {
        if ($endedAt->isBefore($startedAt)) {
            throw ValidationException::withMessages(['focus' => 'A Focus transition cannot precede its running interval.']);
        }

        return (int) $startedAt->diffInSeconds($endedAt);
    }
}
