<?php

namespace App\Support\Tasks;

use App\Enums\TaskCompletionTiming;
use App\Enums\TaskRecurrenceType;
use App\Models\Task;
use App\Services\Tasks\TaskRewardCalculator;
use Carbon\CarbonImmutable;

class TaskViewDataFactory
{
    public function __construct(private readonly TaskRewardCalculator $rewardCalculator) {}

    /** @return array<string, mixed> */
    public function make(Task $task, CarbonImmutable $today, int $currentSeasonId): array
    {
        $completed = $task->completed_at !== null;
        $overdue = ! $completed && $task->scheduled_date->isBefore($today);
        $reward = $completed
            ? null
            : $this->rewardCalculator->calculate($task->important, $task->scheduled_date, $today);
        $completedSubtasks = $task->subtasks->whereNotNull('completed_at')->count();
        $completionLocked = $completed && $task->reward_season_id !== $currentSeasonId;

        return [
            'id' => $task->id,
            'title' => $task->title,
            'scheduledDate' => $task->scheduled_date->toDateString(),
            'originalScheduledDate' => $task->reschedules->first()?->from_date->toDateString(),
            'important' => $task->important,
            'state' => $completed ? 'completed' : ($overdue ? 'overdue' : 'incomplete'),
            'completedAt' => $task->completed_at?->toIso8601String(),
            'completionTiming' => $task->completion_timing?->value,
            'earnedSp' => $task->earned_sp,
            'projectedSp' => $reward?->points,
            'rewardContext' => $completed
                ? $this->completionContext($task)
                : $this->projectionContext($reward->timing, $task->important),
            'lateRewardReduced' => ($completed ? $task->completion_timing : $reward?->timing) === TaskCompletionTiming::Late,
            'rewardSeasonNumber' => $task->rewardSeason?->season_number,
            'completionLocked' => $completionLocked,
            'canUncomplete' => $completed && ! $completionLocked,
            'canEdit' => ! $completed,
            'canDelete' => ! $completed,
            'recurrence' => $this->recurrenceData($task),
            'subtasks' => $task->subtasks->map(fn ($subtask) => [
                'id' => $subtask->id,
                'title' => $subtask->title,
                'completed' => $subtask->completed_at !== null,
            ])->values(),
            'completedSubtasks' => $completedSubtasks,
            'totalSubtasks' => $task->subtasks->count(),
            'canComplete' => ! $completed && $completedSubtasks === $task->subtasks->count(),
            'rescheduleHistory' => $task->reschedules->map(fn ($reschedule) => [
                'fromDate' => $reschedule->from_date->toDateString(),
                'toDate' => $reschedule->to_date->toDateString(),
                'rescheduledAt' => $reschedule->rescheduled_at->toIso8601String(),
            ])->values(),
        ];
    }

    /** @return array<string, mixed>|null */
    private function recurrenceData(Task $task): ?array
    {
        if ($task->series === null || $task->recurrence_type_snapshot === null) {
            return null;
        }

        return [
            'type' => $task->recurrence_type_snapshot->value,
            'weekdays' => $task->recurrence_weekdays_snapshot ?? [],
            'label' => $task->recurrence_type_snapshot === TaskRecurrenceType::Daily
                ? 'Every day'
                : $this->weekdayLabel($task->recurrence_weekdays_snapshot ?? []),
        ];
    }

    /** @param list<int> $weekdays */
    private function weekdayLabel(array $weekdays): string
    {
        $labels = [1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'];

        return implode(' / ', array_map(fn (int $weekday) => $labels[$weekday], $weekdays));
    }

    private function projectionContext(TaskCompletionTiming $timing, bool $important): string
    {
        return ($important ? 'Important' : 'Not important').' · '.match ($timing) {
            TaskCompletionTiming::Early => 'Not urgent',
            TaskCompletionTiming::OnTime => 'Urgent',
            TaskCompletionTiming::Late => 'Late',
        };
    }

    private function completionContext(Task $task): string
    {
        return ($task->importance_at_completion ? 'Important' : 'Not important').' · '.match ($task->completion_timing) {
            TaskCompletionTiming::Early => 'Completed early',
            TaskCompletionTiming::OnTime => 'Completed on time',
            TaskCompletionTiming::Late => 'Completed late',
            default => 'Completed',
        };
    }
}
