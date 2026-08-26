<?php

namespace App\Actions\Seasons;

use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;

class SynchronizeUserSeasons
{
    public const DAYS_PER_SEASON = 30;

    public function __construct(
        private readonly ResolveUserSeasonCycle $resolveUserSeasonCycle,
    ) {}

    public function execute(User $user, ?CarbonImmutable $today = null): Season
    {
        return $this->resolveUserSeasonCycle->execute($user, $today)->requireActiveSeason();
    }
}
