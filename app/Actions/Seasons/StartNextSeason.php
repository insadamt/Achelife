<?php

namespace App\Actions\Seasons;

use App\Models\Season;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StartNextSeason
{
    public function __construct(
        private readonly ResolveUserSeasonCycle $resolveUserSeasonCycle,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, ?CarbonImmutable $today = null): Season
    {
        $calendarDate = ($today ?? $this->userCalendar->today($user))->startOfDay();

        return DB::transaction(function () use ($user, $calendarDate): Season {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $cycle = $this->resolveUserSeasonCycle->execute($lockedUser, $calendarDate);

            if ($cycle->activeSeason !== null) {
                return $cycle->activeSeason;
            }

            if (! $calendarDate->isAfter($cycle->latestSeason->end_date)) {
                throw ValidationException::withMessages([
                    'season' => 'The next Season cannot start before the active Season ends.',
                ]);
            }

            $cycle->intermission?->update(['ended_before' => $calendarDate]);
            $season = $lockedUser->seasons()->create([
                'season_number' => $cycle->latestSeason->season_number + 1,
                'start_date' => $calendarDate,
                'end_date' => $calendarDate->addDays(SynchronizeUserSeasons::DAYS_PER_SEASON - 1),
                'season_points' => 0,
            ]);
            $lockedUser->update(['hold_next_season' => false]);

            return $season;
        }, 3);
    }
}
