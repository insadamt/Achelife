<?php

namespace App\Support\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Season;
use Carbon\CarbonImmutable;

class SeasonViewDataFactory
{
    /** @return array<string, int|string|null> */
    public function forSeason(Season $season, CarbonImmutable $today): array
    {
        $isCurrent = $today->betweenIncluded($season->start_date, $season->end_date);
        $day = $isCurrent ? (int) $season->start_date->diffInDays($today) + 1 : null;

        return [
            'id' => $season->id,
            'number' => $season->season_number,
            'state' => $isCurrent ? 'current' : 'completed',
            'startDate' => $season->start_date->toDateString(),
            'endDate' => $season->end_date->toDateString(),
            'day' => $day,
            'progressPercentage' => $isCurrent ? (int) round(($day / SynchronizeUserSeasons::DAYS_PER_SEASON) * 100) : 100,
            'seasonPoints' => $season->season_points,
            'rank' => $season->rank,
        ];
    }

    /** @return array<string, int|string|null> */
    public function lockedPlaceholder(Season $currentSeason, int $offset): array
    {
        $startDate = $currentSeason->start_date->addDays($offset * SynchronizeUserSeasons::DAYS_PER_SEASON);

        return [
            'id' => null,
            'number' => $currentSeason->season_number + $offset,
            'state' => 'locked',
            'startDate' => $startDate->toDateString(),
            'endDate' => $startDate->addDays(SynchronizeUserSeasons::DAYS_PER_SEASON - 1)->toDateString(),
            'day' => null,
            'progressPercentage' => 0,
            'seasonPoints' => 0,
            'rank' => null,
        ];
    }
}
