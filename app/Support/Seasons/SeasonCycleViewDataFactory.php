<?php

namespace App\Support\Seasons;

use App\Data\Seasons\SeasonCycleResult;
use App\Enums\SeasonIntermissionReason;
use App\Enums\SeasonRolloverPreference;
use Carbon\CarbonImmutable;

class SeasonCycleViewDataFactory
{
    /** @return array<string, mixed> */
    public function make(SeasonCycleResult $cycle, CarbonImmutable $today): array
    {
        $nextStart = $today->startOfDay();

        return [
            'state' => $cycle->isActive() ? 'active' : 'intermission',
            'activeSeasonNumber' => $cycle->activeSeason?->season_number,
            'latestSeasonNumber' => $cycle->latestSeason->season_number,
            'nextSeasonNumber' => $cycle->latestSeason->season_number + 1,
            'holdNextSeason' => (bool) $cycle->latestSeason->user->hold_next_season,
            'rolloverPreference' => ($cycle->latestSeason->user->season_rollover_preference ?? SeasonRolloverPreference::Automatic)->value,
            'intermission' => $cycle->intermission === null ? null : [
                'reason' => $cycle->intermission->reason->value,
                'reasonLabel' => $this->reasonLabel($cycle->intermission->reason),
                'startedOn' => $cycle->intermission->started_on->toDateString(),
                'elapsedRestDays' => (int) $cycle->intermission->started_on->diffInDays($today),
                'proposedStartDate' => $nextStart->toDateString(),
                'proposedEndDate' => $nextStart->addDays(29)->toDateString(),
            ],
        ];
    }

    private function reasonLabel(SeasonIntermissionReason $reason): string
    {
        return match ($reason) {
            SeasonIntermissionReason::ManualRollover => 'Manual rollover',
            SeasonIntermissionReason::OneTimeHold => 'One-time pause',
            SeasonIntermissionReason::Restore => 'Restore hold',
        };
    }
}
