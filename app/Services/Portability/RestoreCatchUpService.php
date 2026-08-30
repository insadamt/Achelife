<?php

namespace App\Services\Portability;

use App\Actions\Diary\RecalculateDiaryProgression;
use App\Actions\Habits\RecalculateHabitProgression;
use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Money\SynchronizeMoneySubscriptions;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Tasks\SynchronizeRecurringTaskOccurrences;
use App\Enums\HabitOccurrenceState;
use App\Enums\SeasonIntermissionReason;
use App\Models\Habit;
use App\Models\Season;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use Carbon\CarbonImmutable;

class RestoreCatchUpService
{
    public function __construct(
        private readonly SynchronizeRecurringTaskOccurrences $synchronizeTasks,
        private readonly SynchronizeHabitOccurrences $synchronizeHabits,
        private readonly RecalculateHabitProgression $recalculateHabitProgression,
        private readonly RecalculateDiaryProgression $recalculateDiaryProgression,
        private readonly SynchronizeMoneySubscriptions $synchronizeSubscriptions,
        private readonly ResolveUserSeasonCycle $resolveSeasonCycle,
        private readonly UserCalendar $calendar,
    ) {}

    /** @return array<string, mixed> */
    public function apply(User $user, Season $latestSeason, array $preview): array
    {
        $user->refresh();
        $today = $this->calendar->today($user);
        $fromDate = data_get($preview, 'catchUp.fromDate');
        $throughDate = data_get($preview, 'catchUp.throughDate');

        if (is_string($fromDate) && is_string($throughDate)) {
            $from = CarbonImmutable::createFromFormat('!Y-m-d', $fromDate, 'UTC');
            $through = CarbonImmutable::createFromFormat('!Y-m-d', $throughDate, 'UTC');
            $user->taskSeries()->get()->each(
                fn ($series) => $this->synchronizeTasks->synchronizeSeries($series, $through, $from),
            );
            $this->synchronizeHabits->execute($user, $through, $from);

            if ($today->isAfter($latestSeason->end_date)) {
                $this->finalizeLastHabitDayAsMissed($latestSeason);
            }

            $diaryReplayDate = $today->isAfter($latestSeason->end_date)
                ? $latestSeason->end_date->addDay()
                : $through;
            $this->recalculateDiaryProgression->execute($user, $latestSeason->refresh(), $diaryReplayDate);
            $this->synchronizeSubscriptions->execute($user, $through, $from);
        }

        $intermission = $user->seasonIntermissions()->updateOrCreate(
            ['after_season_id' => $latestSeason->id],
            [
                'reason' => SeasonIntermissionReason::Restore,
                'started_on' => $latestSeason->end_date->addDay(),
                'ended_before' => null,
            ],
        );
        $user->update(['hold_next_season' => true]);
        $cycle = $this->resolveSeasonCycle->execute($user->refresh(), $today);
        $latestSeason->refresh();

        return [
            'restoredAt' => CarbonImmutable::now('UTC')->toIso8601String(),
            'timezone' => $user->timezone,
            'seasonNumber' => $latestSeason->season_number,
            'seasonEndDate' => $latestSeason->end_date->toDateString(),
            'seasonFinalized' => $latestSeason->finalized_at !== null,
            'seasonCloseoutUrl' => $latestSeason->finalized_at === null ? null : route('seasons.closeout', $latestSeason),
            'activeSeasonContinues' => $cycle->activeSeason !== null,
            'restoreIntermissionStartsOn' => $intermission->started_on->toDateString(),
            'heldSeasonNumber' => $latestSeason->season_number + 1,
            'catchUp' => $preview['catchUp'] ?? null,
        ];
    }

    private function finalizeLastHabitDayAsMissed(Season $season): void
    {
        $habitIds = $season->habitOccurrences()
            ->where('state', HabitOccurrenceState::Pending)
            ->whereDate('occurrence_date', '<=', $season->end_date)
            ->pluck('habit_id')
            ->unique();

        $season->habitOccurrences()
            ->where('state', HabitOccurrenceState::Pending)
            ->whereDate('occurrence_date', '<=', $season->end_date)
            ->update([
                'state' => HabitOccurrenceState::Missed,
                'streak_after' => 0,
                'reward_multiplier' => 0,
                'earned_sp' => 0,
                'resolved_at' => now(),
            ]);

        foreach ($habitIds as $habitId) {
            $habit = Habit::withTrashed()->findOrFail($habitId);
            $this->recalculateHabitProgression->execute($habit, $season->refresh());
        }
    }
}
