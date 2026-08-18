<?php

namespace App\Services\Seasons;

use App\Models\Season;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class SeasonLifecycle
{
    public const OBJECTIVE_SETUP_DAYS = 7;

    public function isActive(Season $season, CarbonImmutable $today): bool
    {
        return $today->betweenIncluded($season->start_date, $season->end_date);
    }

    public function day(Season $season, CarbonImmutable $today): ?int
    {
        if (! $this->isActive($season, $today)) {
            return null;
        }

        return (int) $season->start_date->diffInDays($today) + 1;
    }

    public function objectiveSetupIsOpen(Season $season, CarbonImmutable $today): bool
    {
        $day = $this->day($season, $today);

        return $day !== null && $day <= self::OBJECTIVE_SETUP_DAYS;
    }

    public function ensureObjectiveDefinitionsAreMutable(Season $season, CarbonImmutable $today): void
    {
        if (! $this->objectiveSetupIsOpen($season, $today)) {
            throw ValidationException::withMessages([
                'objective' => 'Objective definitions are locked after Season Day 7.',
            ]);
        }
    }

    public function ensureObjectiveCompletionIsMutable(Season $season, CarbonImmutable $today): void
    {
        if (! $this->isActive($season, $today)) {
            throw ValidationException::withMessages([
                'objective' => 'Objective completion is locked when the Season ends.',
            ]);
        }
    }
}
