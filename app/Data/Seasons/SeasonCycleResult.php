<?php

namespace App\Data\Seasons;

use App\Models\Season;
use App\Models\SeasonIntermission;
use Illuminate\Validation\ValidationException;

readonly class SeasonCycleResult
{
    public function __construct(
        public ?Season $activeSeason,
        public Season $latestSeason,
        public ?SeasonIntermission $intermission,
    ) {}

    public function isActive(): bool
    {
        return $this->activeSeason !== null;
    }

    public function requireActiveSeason(): Season
    {
        if ($this->activeSeason === null) {
            throw ValidationException::withMessages([
                'season' => 'Start your next Season before completing rewarded activities.',
            ]);
        }

        return $this->activeSeason;
    }
}
