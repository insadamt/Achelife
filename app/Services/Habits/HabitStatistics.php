<?php

namespace App\Services\Habits;

use App\Data\Seasons\SeasonCycleResult;
use App\Data\Statistics\StatisticsPeriod;
use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Models\Habit;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Statistics\StatisticsPeriodResolver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class HabitStatistics
{
    public function __construct(private readonly UserCalendar $calendar, private readonly StatisticsPeriodResolver $periods) {}

    public function summarize(User $user, Habit $habit, SeasonCycleResult $cycle, string $filter, ?string $selectionValue): array
    {
        $today = $this->calendar->today($user);
        $period = $this->periods->resolve($user, $cycle, $today, $filter, $selectionValue);
        $query = $habit->occurrences()->whereDate('occurrence_date', '<=', $period->end->min($today));
        if ($start = $period->previousStart ?? $period->start) {
            $query->whereDate('occurrence_date', '>=', $start);
        }
        $occurrences = $query->get();
        $current = $occurrences->filter(fn ($day) => $period->start === null || $day->occurrence_date >= $period->start);
        $previous = $period->previousStart === null ? null : $occurrences->filter(
            fn ($day) => $day->occurrence_date >= $period->previousStart && $day->occurrence_date <= $period->previousEnd,
        );

        return [
            'filter' => $filter,
            'label' => $period->label,
            'comparisonLabel' => $period->comparisonLabel,
            'selector' => ['value' => $period->selectionValue, 'previousValue' => $period->previousSelectionValue, 'nextValue' => $period->nextSelectionValue],
            'current' => $this->totals($current),
            'previous' => $previous === null ? null : $this->totals($previous),
            'currentStreak' => $habit->current_streak,
            'today' => $today->toDateString(),
            'startDate' => ($period->start ?? $habit->starts_on)->toDateString(),
            'endDate' => $period->end->toDateString(),
            'days' => $current->map(fn ($day) => [
                'date' => $day->occurrence_date->toDateString(),
                'state' => $day->state?->value,
                'required' => $day->occurrence_kind === HabitOccurrenceKind::Required,
                'value' => $day->numeric_value === null ? null : (float) $day->numeric_value,
                'target' => $day->target_snapshot === null ? null : (float) $day->target_snapshot,
            ])->values()->all(),
            'trend' => $this->trend($period, $current, $today, $habit->starts_on),
        ];
    }

    private function totals(Collection $days): array
    {
        $required = $days->where('occurrence_kind', HabitOccurrenceKind::Required);
        $completed = $required->where('state', HabitOccurrenceState::Completed)->count();
        $missed = $required->where('state', HabitOccurrenceState::Missed)->count();
        $recorded = $days->whereNotNull('numeric_value');
        $streak = 0;
        $best = 0;
        foreach ($days as $day) {
            if ($day->state === HabitOccurrenceState::Completed) {
                $best = max($best, ++$streak);
            } elseif ($day->state === HabitOccurrenceState::Missed && $day->occurrence_kind === HabitOccurrenceKind::Required) {
                $streak = 0;
            }
        }

        return [
            'completionRate' => $completed + $missed > 0 ? round($completed / ($completed + $missed) * 100, 1) : null,
            'completed' => $days->where('state', HabitOccurrenceState::Completed)->count(),
            'requiredCompleted' => $completed,
            'missed' => $missed,
            'skipped' => $required->where('state', HabitOccurrenceState::Skipped)->count(),
            'extras' => $days->where('occurrence_kind', HabitOccurrenceKind::FlexibleExtra)->where('state', HabitOccurrenceState::Completed)->count(),
            'bestStreak' => $best,
            'total' => round($recorded->sum('numeric_value'), 3),
            'average' => $recorded->isEmpty() ? null : round($recorded->avg('numeric_value'), 3),
            'recordedDays' => $recorded->count(),
        ];
    }

    private function trend(StatisticsPeriod $period, Collection $days, CarbonImmutable $today, CarbonImmutable $habitStart): array
    {
        $start = $period->start ?? $habitStart;
        $end = $period->end->min($today);
        $unit = in_array($period->key, ['season', 'month'], true) ? 'day' : 'month';
        if ($period->key === 'all' && $start->diffInMonths($end) > 36) {
            $unit = 'year';
        }
        $format = match ($unit) {
            'day' => 'Y-m-d', 'month' => 'Y-m', default => 'Y'
        };
        $grouped = $days->groupBy(fn ($day) => $day->occurrence_date->format($format));
        $buckets = [];
        for ($date = $start->startOf($unit); $date <= $end; $date = $date->addUnit($unit)) {
            $bucketDays = $grouped->get($date->format($format), collect());
            $totals = $this->totals($bucketDays);
            $buckets[] = [
                'date' => $date->format($format),
                'label' => $date->format(match ($unit) {
                    'day' => 'M j', 'month' => 'M Y', default => 'Y'
                }),
                'completed' => $totals['completed'], 'total' => $totals['total'], 'average' => $totals['average'],
                'target' => $unit === 'day' && $bucketDays->first()?->target_snapshot !== null ? (float) $bucketDays->first()->target_snapshot : null,
            ];
        }

        return ['unit' => $unit, 'buckets' => $buckets];
    }
}
