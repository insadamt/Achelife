<?php

namespace App\Actions\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Task;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Tasks\TaskRewardCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompleteTask
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeUserSeasons,
        private readonly TaskRewardCalculator $rewardCalculator,
        private readonly SynchronizeRecurringTaskOccurrences $synchronizeOccurrences,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, Task $task, ?CarbonImmutable $completedAt = null): Task
    {
        if ($task->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $completionTime = $completedAt ?? CarbonImmutable::now();
        $completionDate = $this->userCalendar->dateOf($user, $completionTime);

        return DB::transaction(function () use ($user, $task, $completionTime, $completionDate): Task {
            $rewardSeason = $this->synchronizeUserSeasons->execute($user, $completionDate);
            $lockedTask = Task::query()->with('subtasks')->lockForUpdate()->findOrFail($task->id);

            if ($lockedTask->completed_at !== null) {
                throw ValidationException::withMessages(['task' => 'This Task is already completed.']);
            }

            if ($lockedTask->subtasks->contains(fn ($subtask) => $subtask->completed_at === null)) {
                throw ValidationException::withMessages(['task' => 'Complete every subtask before completing the parent Task.']);
            }

            $reward = $this->rewardCalculator->calculate(
                $lockedTask->important,
                $lockedTask->scheduled_date,
                $completionDate,
            );

            $rewardSeason->increment('season_points', $reward->points);
            $lockedTask->update([
                'completed_at' => $completionTime,
                'completion_timing' => $reward->timing,
                'importance_at_completion' => $reward->important,
                'earned_sp' => $reward->points,
                'reward_season_id' => $rewardSeason->id,
            ]);

            if ($lockedTask->task_series_id !== null) {
                $this->synchronizeOccurrences->synchronizeSeries(
                    $lockedTask->series()->firstOrFail(),
                    $completionDate,
                );
            }

            return $lockedTask->refresh()->load('rewardSeason');
        });
    }
}
