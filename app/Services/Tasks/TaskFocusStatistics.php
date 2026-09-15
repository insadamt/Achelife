<?php

namespace App\Services\Tasks;

use App\Data\Statistics\StatisticsPeriod;
use App\Enums\TaskFocusSessionState;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class TaskFocusStatistics
{
    public function summarize(User $user, StatisticsPeriod $period, CarbonImmutable $today): array
    {
        $current = $this->emptyPeriodData();
        $previous = $period->previousStart === null ? null : $this->emptyPeriodData();

        foreach ($this->intervalQuery($user, $period)->cursor() as $interval) {
            $this->attributeInterval($interval, $user->timezone, $period, $current, $previous);
        }

        $currentStart = $period->start ?? $this->firstAttributedDate($current, $today);

        return [
            'current' => $this->finalizeTotals($current),
            'previous' => $previous === null ? null : $this->finalizeTotals($previous),
            'trend' => $this->buildTrend($period, $current['dailySeconds'], $currentStart, $today),
            'heatmap' => $this->buildHeatmap($current['dailySeconds'], $currentStart, $period->end->min($today)),
            'projects' => $this->rankProjects($current['projectSeconds']),
            'tasks' => $this->rankTasks($current['taskSeconds']),
        ];
    }

    private function intervalQuery(User $user, StatisticsPeriod $period): Builder
    {
        $query = DB::table('task_focus_intervals as intervals')
            ->join('task_focus_sessions as sessions', 'sessions.id', '=', 'intervals.task_focus_session_id')
            ->join('tasks', 'tasks.id', '=', 'sessions.task_id')
            ->leftJoin('task_projects as projects', 'projects.id', '=', 'tasks.task_project_id')
            ->where('sessions.user_id', $user->id)
            ->where('sessions.state', TaskFocusSessionState::Completed->value)
            ->whereNotNull('intervals.ended_at')
            ->where('intervals.started_at', '<', $this->localDayStartUtc($period->end->addDay(), $user->timezone))
            ->orderBy('intervals.started_at')
            ->orderBy('intervals.id')
            ->select([
                'intervals.started_at',
                'intervals.ended_at',
                'sessions.id as session_id',
                'tasks.id as task_id',
                'tasks.title as task_title',
                'tasks.task_project_id as project_id',
                'projects.name as project_name',
            ]);

        $queryStart = $period->previousStart ?? $period->start;
        if ($queryStart !== null) {
            $query->where('intervals.ended_at', '>', $this->localDayStartUtc($queryStart, $user->timezone));
        }

        return $query;
    }

    private function attributeInterval(object $interval, string $timezone, StatisticsPeriod $period, array &$current, ?array &$previous): void
    {
        $cursor = CarbonImmutable::parse($interval->started_at, 'UTC');
        $intervalEnd = CarbonImmutable::parse($interval->ended_at, 'UTC');

        while ($cursor->lessThan($intervalEnd)) {
            $localCursor = $cursor->setTimezone($timezone);
            $date = $localCursor->toDateString();
            $nextDay = $localCursor->startOfDay()->addDay()->utc();
            $portionEnd = $nextDay->lessThan($intervalEnd) ? $nextDay : $intervalEnd;
            $seconds = (int) $cursor->diffInSeconds($portionEnd);

            if ($seconds > 0 && $this->belongsToCurrentPeriod($date, $period)) {
                $this->addPortion($current, $interval, $date, $seconds);
            } elseif ($seconds > 0 && $previous !== null && $this->belongsToPreviousPeriod($date, $period)) {
                $this->addPortion($previous, $interval, $date, $seconds);
            }

            $cursor = $portionEnd;
        }
    }

    private function belongsToCurrentPeriod(string $date, StatisticsPeriod $period): bool
    {
        return ($period->start === null || $date >= $period->start->toDateString())
            && $date <= $period->end->toDateString();
    }

    private function belongsToPreviousPeriod(string $date, StatisticsPeriod $period): bool
    {
        return $date >= $period->previousStart?->toDateString()
            && $date <= $period->previousEnd?->toDateString();
    }

    private function addPortion(array &$data, object $interval, string $date, int $seconds): void
    {
        $sessionId = (int) $interval->session_id;
        $taskId = (int) $interval->task_id;
        $projectKey = $interval->project_id === null ? 'inbox' : 'project:'.$interval->project_id;

        $data['totalSeconds'] += $seconds;
        $data['dailySeconds'][$date] = ($data['dailySeconds'][$date] ?? 0) + $seconds;
        $data['sessionSeconds'][$sessionId] = ($data['sessionSeconds'][$sessionId] ?? 0) + $seconds;
        $data['taskSeconds'][$taskId] ??= ['id' => $taskId, 'title' => $interval->task_title, 'seconds' => 0];
        $data['taskSeconds'][$taskId]['seconds'] += $seconds;
        $data['projectSeconds'][$projectKey] ??= [
            'id' => $interval->project_id === null ? null : (int) $interval->project_id,
            'name' => $interval->project_name ?? 'Inbox',
            'seconds' => 0,
        ];
        $data['projectSeconds'][$projectKey]['seconds'] += $seconds;
    }

    private function emptyPeriodData(): array
    {
        return [
            'totalSeconds' => 0,
            'dailySeconds' => [],
            'sessionSeconds' => [],
            'projectSeconds' => [],
            'taskSeconds' => [],
        ];
    }

    private function finalizeTotals(array $data): array
    {
        $sessionCount = count($data['sessionSeconds']);
        $activeDays = count($data['dailySeconds']);

        return [
            'totalSeconds' => $data['totalSeconds'],
            'sessionCount' => $sessionCount,
            'averageSessionSeconds' => $sessionCount > 0 ? (int) round($data['totalSeconds'] / $sessionCount) : 0,
            'averageActiveDaySeconds' => $activeDays > 0 ? (int) round($data['totalSeconds'] / $activeDays) : 0,
            'longestSessionSeconds' => $sessionCount > 0 ? max($data['sessionSeconds']) : 0,
        ];
    }

    private function buildTrend(StatisticsPeriod $period, array $dailySeconds, CarbonImmutable $start, CarbonImmutable $today): array
    {
        $end = $period->end->min($today);
        $unit = in_array($period->key, ['season', 'month'], true) ? 'day' : 'month';
        if ($period->key === 'all' && $start->diffInMonths($end) > 36) {
            $unit = 'year';
        }

        $format = match ($unit) {
            'day' => 'Y-m-d',
            'month' => 'Y-m',
            default => 'Y',
        };
        $activity = [];
        foreach ($dailySeconds as $date => $seconds) {
            $key = CarbonImmutable::parse($date, 'UTC')->format($format);
            $activity[$key] = ($activity[$key] ?? 0) + $seconds;
        }

        $buckets = [];
        for ($date = $start->startOf($unit); $date <= $end; $date = $date->addUnit($unit)) {
            $key = $date->format($format);
            $buckets[] = [
                'date' => $key,
                'label' => $date->format(match ($unit) {
                    'day' => 'M j',
                    'month' => 'M Y',
                    default => 'Y',
                }),
                'seconds' => $activity[$key] ?? 0,
            ];
        }

        return ['unit' => $unit, 'buckets' => $buckets];
    }

    private function buildHeatmap(array $dailySeconds, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $days = [];
        for ($date = $start; $date <= $end; $date = $date->addDay()) {
            $key = $date->toDateString();
            $days[] = ['date' => $key, 'seconds' => $dailySeconds[$key] ?? 0];
        }

        return [
            'startDate' => $start->toDateString(),
            'endDate' => $end->toDateString(),
            'days' => $days,
        ];
    }

    private function rankProjects(array $projects): array
    {
        return $this->rank($projects, fn (array $project): array => $project);
    }

    private function rankTasks(array $tasks): array
    {
        return array_slice($this->rank($tasks, fn (array $task): array => $task), 0, 10);
    }

    private function rank(array $items, callable $transform): array
    {
        $ranked = array_values(array_map($transform, $items));
        usort($ranked, fn (array $left, array $right): int => $right['seconds'] <=> $left['seconds'] ?: strcasecmp($left['name'] ?? $left['title'], $right['name'] ?? $right['title']));

        return $ranked;
    }

    private function firstAttributedDate(array $data, CarbonImmutable $today): CarbonImmutable
    {
        if ($data['dailySeconds'] === []) {
            return $today;
        }

        return CarbonImmutable::parse(min(array_keys($data['dailySeconds'])), 'UTC');
    }

    private function localDayStartUtc(CarbonImmutable $date, string $timezone): CarbonImmutable
    {
        return CarbonImmutable::parse($date->toDateString(), $timezone)->startOfDay()->utc();
    }
}
