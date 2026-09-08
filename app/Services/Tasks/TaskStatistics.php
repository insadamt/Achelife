<?php

namespace App\Services\Tasks;

use App\Data\Seasons\SeasonCycleResult;
use App\Data\Statistics\StatisticsPeriod;
use App\Enums\TaskCompletionTiming;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Statistics\StatisticsPeriodResolver;
use Carbon\CarbonImmutable;

class TaskStatistics
{
    public function __construct(private readonly UserCalendar $calendar, private readonly StatisticsPeriodResolver $periods) {}

    public function summarize(User $user, SeasonCycleResult $cycle, string $filter, ?string $selectionValue = null): array
    {
        $today = $this->calendar->today($user);
        $period = $this->periods->resolve($user, $cycle, $today, $filter, $selectionValue);
        $current = $this->emptyTotals();
        $previous = $period->previousStart ? $this->emptyTotals() : null;
        $dailyActivity = [];
        $query = $user->tasks()->whereNotNull('completed_at')
            ->where('completed_at', '<=', CarbonImmutable::now('UTC'));
        $queryStart = $period->previousStart ?? $period->start;
        if ($queryStart) {
            $query->where('completed_at', '>=', CarbonImmutable::parse($queryStart->toDateString(), $user->timezone)->utc());
        }

        foreach ($query->select(['id', 'completed_at', 'completion_timing', 'importance_at_completion', 'earned_sp'])->cursor() as $task) {
            $date = $this->calendar->dateOf($user, $task->completed_at);
            if (($period->start === null || $date >= $period->start) && $date <= $period->end) {
                $this->addCompletion($current, $task->earned_sp, $task->importance_at_completion, $task->completion_timing);
                $key = $date->toDateString();
                $dailyActivity[$key] ??= ['count' => 0, 'sp' => 0];
                $dailyActivity[$key]['count']++;
                $dailyActivity[$key]['sp'] += $task->earned_sp ?? 0;
            } elseif ($previous !== null && $date >= $period->previousStart && $date <= $period->previousEnd) {
                $this->addCompletion($previous, $task->earned_sp, $task->importance_at_completion, $task->completion_timing);
            }
        }

        return [
            'filter' => $filter,
            'label' => $period->label,
            'comparisonLabel' => $period->comparisonLabel,
            'selector' => [
                'value' => $period->selectionValue,
                'previousValue' => $period->previousSelectionValue,
                'nextValue' => $period->nextSelectionValue,
            ],
            'current' => $this->finalizeTotals($current),
            'previous' => $previous === null ? null : $this->finalizeTotals($previous),
            'trend' => $this->buildTrend($period, $dailyActivity, $today),
        ];
    }

    private function emptyTotals(): array
    {
        return ['completed' => 0, 'sp' => 0, 'important' => 0, 'onTimeCount' => 0];
    }

    private function addCompletion(array &$totals, ?int $points, ?bool $important, ?TaskCompletionTiming $timing): void
    {
        $totals['completed']++;
        $totals['sp'] += $points ?? 0;
        $totals['important'] += (int) $important;
        $totals['onTimeCount'] += (int) in_array($timing, [TaskCompletionTiming::Early, TaskCompletionTiming::OnTime], true);
    }

    private function finalizeTotals(array $totals): array
    {
        $totals['onTime'] = $totals['completed'] > 0 ? round($totals['onTimeCount'] / $totals['completed'] * 100, 1) : null;
        unset($totals['onTimeCount']);

        return $totals;
    }

    private function buildTrend(StatisticsPeriod $period, array $dailyActivity, CarbonImmutable $today): array
    {
        ksort($dailyActivity);
        $start = $period->start ?? CarbonImmutable::parse(array_key_first($dailyActivity) ?? $today->toDateString(), 'UTC');
        $end = $period->end->min($today);
        $unit = in_array($period->key, ['season', 'month'], true) ? 'day' : 'month';
        if ($period->key === 'all' && $start->diffInMonths($end) > 36) {
            $unit = 'year';
        }
        $format = match ($unit) {
            'day' => 'Y-m-d', 'month' => 'Y-m', default => 'Y'
        };
        $activity = [];
        foreach ($dailyActivity as $date => $values) {
            $key = CarbonImmutable::parse($date, 'UTC')->format($format);
            $activity[$key] ??= ['count' => 0, 'sp' => 0];
            $activity[$key]['count'] += $values['count'];
            $activity[$key]['sp'] += $values['sp'];
        }
        $buckets = [];
        for ($date = $start->startOf($unit); $date <= $end; $date = $date->addUnit($unit)) {
            $key = $date->format($format);
            $buckets[] = ['date' => $key, 'label' => $date->format(match ($unit) {
                'day' => 'M j', 'month' => 'M Y', default => 'Y'
            }), 'count' => $activity[$key]['count'] ?? 0, 'sp' => $activity[$key]['sp'] ?? 0];
        }

        return ['unit' => $unit, 'buckets' => $buckets];
    }
}
