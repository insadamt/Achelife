<?php

namespace App\Services\Tasks;

use App\Data\Tasks\ManualFocusSessionData;
use App\Models\TaskFocusInterval;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class TaskFocusIntervalIntegrity
{
    public const MAXIMUM_MANUAL_SECONDS = 86400;

    public function validate(User $user, ManualFocusSessionData $data, ?int $excludedSessionId = null): void
    {
        $duration = $data->startedAt->diffInSeconds($data->endedAt, false);

        if ($duration <= 0) {
            throw ValidationException::withMessages(['ended_at' => 'The end time must be after the start time.']);
        }

        if ($duration > self::MAXIMUM_MANUAL_SECONDS) {
            throw ValidationException::withMessages(['ended_at' => 'A Focus Session cannot be longer than 24 hours.']);
        }

        $now = CarbonImmutable::now('UTC');
        $overlaps = TaskFocusInterval::query()
            ->whereHas('session', function ($query) use ($user, $excludedSessionId): void {
                $query->where('user_id', $user->id)
                    ->when($excludedSessionId !== null, fn ($query) => $query->whereKeyNot($excludedSessionId));
            })
            ->where('started_at', '<', $data->endedAt)
            ->where(function ($query) use ($data, $now): void {
                $query->where('ended_at', '>', $data->startedAt)
                    ->when($now->isAfter($data->startedAt), fn ($query) => $query->orWhereNull('ended_at'));
            })
            ->exists();

        if ($overlaps) {
            throw ValidationException::withMessages(['started_at' => 'This time overlaps another Focus interval.']);
        }
    }
}
