<?php

namespace App\Actions\Habits;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Models\Habit;
use App\Models\HabitDefinitionVersion;
use App\Models\Season;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Habits\HabitDefinitionResolver;
use App\Services\Habits\HabitSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SynchronizeHabitOccurrences
{
    public function __construct(
        private readonly ResolveUserSeasonCycle $resolveUserSeasonCycle,
        private readonly HabitDefinitionResolver $definitionResolver,
        private readonly HabitSchedule $schedule,
        private readonly RecalculateHabitProgression $recalculateProgression,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, ?CarbonImmutable $today = null): ?Season
    {
        $calendarDate = ($today ?? $this->userCalendar->today($user))->startOfDay();
        $currentSeason = $this->resolveUserSeasonCycle->execute($user, $calendarDate)->activeSeason;

        if ($currentSeason === null) {
            return null;
        }
        $seasons = $user->seasons()->orderBy('start_date')->get();
        $habits = $user->habits()->whereNull('archived_at')->with('definitionVersions')->get();

        foreach ($habits as $habit) {
            $this->synchronizeHabit($habit, $calendarDate, $currentSeason, $seasons);
        }

        return $currentSeason->refresh();
    }

    /** @param Collection<int, Season> $seasons */
    public function synchronizeHabit(
        Habit $habit,
        CarbonImmutable $today,
        Season $currentSeason,
        Collection $seasons,
    ): void {
        DB::transaction(function () use ($habit, $today, $seasons): void {
            $lockedHabit = Habit::query()->lockForUpdate()->findOrFail($habit->id);
            $lockedHabit->load('definitionVersions');
            $lockedHabit->occurrences()
                ->where('state', HabitOccurrenceState::Pending)
                ->whereDate('occurrence_date', '<', $today)
                ->update([
                    'state' => HabitOccurrenceState::Missed,
                    'streak_after' => 0,
                    'reward_multiplier' => 0,
                    'earned_sp' => 0,
                    'resolved_at' => now(),
                ]);
            $nextDate = $lockedHabit->synchronized_through?->addDay() ?? $lockedHabit->starts_on;

            while ($nextDate->lessThanOrEqualTo($today)) {
                $definition = $this->definitionResolver->fromLoadedVersions($lockedHabit->definitionVersions, $nextDate);

                if ($this->schedule->isRequired($definition, $nextDate)) {
                    $season = $seasons->first(
                        fn (Season $candidate) => $nextDate->betweenIncluded($candidate->start_date, $candidate->end_date),
                    );

                    if ($season === null) {
                        $nextDate = $nextDate->addDay();

                        continue;
                    }

                    $this->materializeRequiredOccurrence($lockedHabit, $definition, $season, $nextDate, $today);
                }

                $nextDate = $nextDate->addDay();
            }

            if ($lockedHabit->synchronized_through === null || $lockedHabit->synchronized_through->isBefore($today)) {
                $lockedHabit->update(['synchronized_through' => $today]);
            }
        }, 3);

        $this->recalculateProgression->execute($habit, $currentSeason);
    }

    private function materializeRequiredOccurrence(
        Habit $habit,
        HabitDefinitionVersion $definition,
        Season $season,
        CarbonImmutable $date,
        CarbonImmutable $today,
    ): void {
        $habit->occurrences()->firstOrCreate(
            ['occurrence_date' => $date->toDateString()],
            [
                'user_id' => $habit->user_id,
                'season_id' => $season->id,
                'occurrence_kind' => HabitOccurrenceKind::Required,
                'state' => $date->isBefore($today) ? HabitOccurrenceState::Missed : HabitOccurrenceState::Pending,
                'target_snapshot' => $definition->numeric_target,
                'difficulty_snapshot' => $definition->difficulty,
                'schedule_type_snapshot' => $definition->schedule_type,
                'schedule_weekdays_snapshot' => $definition->weekdays,
                'flexible_snapshot' => $definition->flexible,
                'base_reward' => $definition->difficulty->baseReward(),
                'resolved_at' => $date->isBefore($today) ? now() : null,
            ],
        );
    }
}
