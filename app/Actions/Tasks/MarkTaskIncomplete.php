<?php

namespace App\Actions\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class MarkTaskIncomplete
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeUserSeasons,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, Task $task, ?CarbonImmutable $today = null): Task
    {
        if ($task->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $calendarDate = ($today ?? $this->userCalendar->today($user))->startOfDay();

        return DB::transaction(function () use ($user, $task, $calendarDate): Task {
            $currentSeason = $this->synchronizeUserSeasons->execute($user, $calendarDate);
            $lockedTask = Task::query()->lockForUpdate()->findOrFail($task->id);

            if ($lockedTask->completed_at === null || $lockedTask->reward_season_id === null || $lockedTask->earned_sp === null) {
                throw ValidationException::withMessages(['task' => 'This Task is not completed.']);
            }

            if ($lockedTask->reward_season_id !== $currentSeason->id) {
                throw ValidationException::withMessages(['task' => 'This completion is locked because its Season has ended.']);
            }

            $rewardSeason = Season::query()->lockForUpdate()->findOrFail($lockedTask->reward_season_id);
            if ($rewardSeason->season_points < $lockedTask->earned_sp) {
                throw new RuntimeException('Season SP is lower than the exact Task reward being reversed.');
            }

            $rewardSeason->update(['season_points' => $rewardSeason->season_points - $lockedTask->earned_sp]);
            $lockedTask->update([
                'completed_at' => null,
                'completion_timing' => null,
                'importance_at_completion' => null,
                'earned_sp' => null,
                'reward_season_id' => null,
            ]);

            return $lockedTask->refresh();
        });
    }
}
