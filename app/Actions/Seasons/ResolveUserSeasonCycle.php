<?php

namespace App\Actions\Seasons;

use App\Data\Seasons\SeasonCycleResult;
use App\Enums\SeasonIntermissionReason;
use App\Enums\SeasonRolloverPreference;
use App\Models\Season;
use App\Models\SeasonIntermission;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Seasons\SeasonRankCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ResolveUserSeasonCycle
{
    public function __construct(
        private readonly SeasonRankCalculator $seasonRankCalculator,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, ?CarbonImmutable $today = null): SeasonCycleResult
    {
        $calendarDate = ($today ?? $this->userCalendar->today($user))->startOfDay();

        return DB::transaction(function () use ($user, $calendarDate): SeasonCycleResult {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->getKey());
            $latestSeason = $lockedUser->seasons()->latest('season_number')->first();

            if ($latestSeason === null) {
                $latestSeason = $this->createFirstSeason($lockedUser, $calendarDate);
            }

            $this->assertValidTimeline($lockedUser);

            if ($calendarDate->betweenIncluded($latestSeason->start_date, $latestSeason->end_date)) {
                return new SeasonCycleResult($latestSeason->refresh(), $latestSeason->refresh(), null);
            }

            if ($calendarDate->isBefore($latestSeason->start_date)) {
                throw new RuntimeException('A Season cannot be resolved before the latest persisted Season.');
            }

            $this->finalizeEndedSeasons($lockedUser, $calendarDate);
            $openIntermission = $lockedUser->seasonIntermissions()->whereNull('ended_before')->first();

            if ($openIntermission !== null) {
                return new SeasonCycleResult(null, $latestSeason->refresh(), $openIntermission);
            }

            if ($lockedUser->hold_next_season || ($lockedUser->season_rollover_preference ?? SeasonRolloverPreference::Automatic) === SeasonRolloverPreference::Manual) {
                $reason = $lockedUser->hold_next_season
                    ? SeasonIntermissionReason::OneTimeHold
                    : SeasonIntermissionReason::ManualRollover;
                $intermission = $this->openIntermission($lockedUser, $latestSeason, $reason);

                return new SeasonCycleResult(null, $latestSeason->refresh(), $intermission);
            }

            $activeSeason = $this->backfillAutomaticSeasons($lockedUser, $latestSeason, $calendarDate);

            return new SeasonCycleResult($activeSeason, $activeSeason, null);
        }, 3);
    }

    private function createFirstSeason(User $user, CarbonImmutable $today): Season
    {
        $startDate = $user->calendar_started_on;

        if ($startDate === null) {
            throw new RuntimeException('The user calendar start date is missing.');
        }

        if ($today->isBefore($startDate)) {
            throw new RuntimeException('A Season cannot be synchronized before the account creation date.');
        }

        return $user->seasons()->create([
            'season_number' => 1,
            'start_date' => $startDate,
            'end_date' => $startDate->addDays(SynchronizeUserSeasons::DAYS_PER_SEASON - 1),
            'season_points' => 0,
        ]);
    }

    private function backfillAutomaticSeasons(User $user, Season $latestSeason, CarbonImmutable $today): Season
    {
        while ($today->isAfter($latestSeason->end_date)) {
            $this->finalizeEndedSeason($latestSeason);
            $startDate = $latestSeason->end_date->addDay();
            $endDate = $startDate->addDays(SynchronizeUserSeasons::DAYS_PER_SEASON - 1);
            $latestSeason = $user->seasons()->create([
                'season_number' => $latestSeason->season_number + 1,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'season_points' => 0,
                'introduced_at' => $today->isAfter($endDate) ? now() : null,
            ]);
        }

        return $latestSeason->refresh();
    }

    private function openIntermission(User $user, Season $latestSeason, SeasonIntermissionReason $reason): SeasonIntermission
    {
        return $user->seasonIntermissions()->firstOrCreate(
            ['after_season_id' => $latestSeason->id],
            [
                'reason' => $reason,
                'started_on' => $latestSeason->end_date->addDay(),
            ],
        );
    }

    private function finalizeEndedSeasons(User $user, CarbonImmutable $today): void
    {
        $user->seasons()->whereDate('end_date', '<', $today)->get()->each(
            fn (Season $season) => $this->finalizeEndedSeason($season),
        );
    }

    private function finalizeEndedSeason(Season $season): void
    {
        $updates = [];

        if ($season->rank === null || ! $this->seasonRankCalculator->supportsSnapshot($season->rank)) {
            $updates['rank'] = $this->seasonRankCalculator->calculate($season->season_points)->key;
        }

        if ($season->introduced_at === null) {
            $updates['introduced_at'] = now();
        }

        if ($season->finalized_at === null) {
            $updates['finalized_at'] = now();
        }

        if ($updates !== []) {
            $season->update($updates);
        }
    }

    private function assertValidTimeline(User $user): void
    {
        $previousSeason = null;

        foreach ($user->seasons()->orderBy('season_number')->get() as $season) {
            if ((int) $season->start_date->diffInDays($season->end_date) !== SynchronizeUserSeasons::DAYS_PER_SEASON - 1) {
                throw new RuntimeException("Season {$season->season_number} must last exactly 30 calendar days.");
            }

            if ($previousSeason !== null) {
                if ($season->season_number !== $previousSeason->season_number + 1) {
                    throw new RuntimeException('Season numbers must be consecutive.');
                }

                if (! $season->start_date->isAfter($previousSeason->end_date)) {
                    throw new RuntimeException('Seasons cannot overlap.');
                }
            }

            $previousSeason = $season;
        }
    }
}
