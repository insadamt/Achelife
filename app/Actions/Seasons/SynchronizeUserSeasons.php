<?php

namespace App\Actions\Seasons;

use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class SynchronizeUserSeasons
{
    public const DAYS_PER_SEASON = 30;

    public function execute(User $user, ?CarbonImmutable $today = null): Season
    {
        $calendarDate = ($today ?? CarbonImmutable::today())->startOfDay();

        return DB::transaction(function () use ($user, $calendarDate): Season {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->getKey());
            $firstSeasonStart = $lockedUser->created_at->toImmutable()->startOfDay();

            if ($calendarDate->isBefore($firstSeasonStart)) {
                throw new RuntimeException('A Season cannot be synchronized before the account creation date.');
            }

            $currentSeasonNumber = intdiv((int) $firstSeasonStart->diffInDays($calendarDate), self::DAYS_PER_SEASON) + 1;

            $existingSeasons = $lockedUser->seasons()
                ->where('season_number', '<=', $currentSeasonNumber)
                ->get()
                ->keyBy('season_number');

            for ($seasonNumber = 1; $seasonNumber <= $currentSeasonNumber; $seasonNumber++) {
                $expectedStart = $firstSeasonStart->addDays(($seasonNumber - 1) * self::DAYS_PER_SEASON);
                $expectedEnd = $expectedStart->addDays(self::DAYS_PER_SEASON - 1);
                $season = $existingSeasons->get($seasonNumber);

                if ($season === null) {
                    $season = $lockedUser->seasons()->create([
                        'season_number' => $seasonNumber,
                        'start_date' => $expectedStart,
                        'end_date' => $expectedEnd,
                        'introduced_at' => $seasonNumber < $currentSeasonNumber ? now() : null,
                    ]);
                    $existingSeasons->put($seasonNumber, $season);
                }

                $this->assertExpectedDates($season, $expectedStart, $expectedEnd);

                if ($seasonNumber < $currentSeasonNumber && $season->introduced_at === null) {
                    $season->update(['introduced_at' => now()]);
                }
            }

            return $existingSeasons->get($currentSeasonNumber)->refresh();
        }, 3);
    }

    private function assertExpectedDates(Season $season, CarbonImmutable $expectedStart, CarbonImmutable $expectedEnd): void
    {
        if (! $season->start_date->isSameDay($expectedStart) || ! $season->end_date->isSameDay($expectedEnd)) {
            throw new RuntimeException("Season {$season->season_number} has dates inconsistent with the account timeline.");
        }
    }
}
