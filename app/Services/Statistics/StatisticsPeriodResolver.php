<?php

namespace App\Services\Statistics;

use App\Data\Seasons\SeasonCycleResult;
use App\Data\Statistics\StatisticsPeriod;
use App\Models\User;
use Carbon\CarbonImmutable;

class StatisticsPeriodResolver
{
    public function resolve(User $user, SeasonCycleResult $cycle, CarbonImmutable $today, string $filter, ?string $selectionValue): StatisticsPeriod
    {
        if ($filter === 'all') {
            return new StatisticsPeriod('all', null, $today, null, null, 'All time', null, null, null, null);
        }
        if ($filter === 'season') {
            $defaultSeason = $cycle->activeSeason ?? $cycle->latestSeason;
            $season = ctype_digit((string) $selectionValue)
                ? $user->seasons()->where('season_number', (int) $selectionValue)->first() ?? $defaultSeason
                : $defaultSeason;
            $previous = $user->seasons()->where('season_number', '<', $season->season_number)->orderByDesc('season_number')->first();
            $next = $user->seasons()->where('season_number', '>', $season->season_number)->orderBy('season_number')->first();

            return new StatisticsPeriod('season', $season->start_date, $season->end_date, $previous?->start_date, $previous?->end_date,
                'Season '.$season->season_number,
                $previous ? 'vs full Season '.$previous->season_number : 'No previous season',
                (string) $season->season_number,
                $previous ? (string) $previous->season_number : null,
                $next ? (string) $next->season_number : null);
        }
        $start = $this->resolveCalendarStart($filter, $selectionValue, $today);
        $previousStart = $filter === 'month' ? $start->subMonth() : $start->subYear();
        $currentStart = $filter === 'month' ? $today->startOfMonth() : $today->startOfYear();
        $end = $start->equalTo($currentStart)
            ? $today
            : ($filter === 'month' ? $start->endOfMonth() : $start->endOfYear());
        $format = $filter === 'month' ? 'Y-m' : 'Y';

        return new StatisticsPeriod($filter, $start, $end, $previousStart, $start->subDay(),
            $start->format($filter === 'month' ? 'F Y' : 'Y'),
            'vs full '.$previousStart->format($filter === 'month' ? 'F Y' : 'Y'),
            $start->format($format),
            $previousStart->format($format),
            $start->lessThan($currentStart) ? ($filter === 'month' ? $start->addMonth() : $start->addYear())->format($format) : null);
    }

    private function resolveCalendarStart(string $filter, ?string $selectionValue, CarbonImmutable $today): CarbonImmutable
    {
        $currentStart = $filter === 'month' ? $today->startOfMonth() : $today->startOfYear();
        $format = $filter === 'month' ? '!Y-m' : '!Y';
        $pattern = $filter === 'month' ? '/^[1-9]\d{3}-(?:0[1-9]|1[0-2])$/' : '/^[1-9]\d{3}$/';
        $selected = $selectionValue !== null && preg_match($pattern, $selectionValue)
            ? CarbonImmutable::createFromFormat($format, $selectionValue, 'UTC')
            : null;

        if (! $selected || $selected->format($filter === 'month' ? 'Y-m' : 'Y') !== $selectionValue || $selected->greaterThan($currentStart)) {
            return $currentStart;
        }

        return $filter === 'month' ? $selected->startOfMonth() : $selected->startOfYear();
    }
}
