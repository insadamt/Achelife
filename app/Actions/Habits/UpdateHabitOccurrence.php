<?php

namespace App\Actions\Habits;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitType;
use App\Models\Habit;
use App\Models\HabitDefinitionVersion;
use App\Models\HabitOccurrence;
use App\Models\Season;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Habits\HabitDefinitionResolver;
use App\Services\Habits\HabitSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateHabitOccurrence
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeUserSeasons,
        private readonly SynchronizeHabitOccurrences $synchronizeOccurrences,
        private readonly HabitDefinitionResolver $definitionResolver,
        private readonly HabitSchedule $schedule,
        private readonly RecalculateHabitProgression $recalculateProgression,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function toggleBoolean(User $user, Habit $habit, CarbonImmutable $date, ?CarbonImmutable $today = null): void
    {
        $this->mutate($user, $habit, $date, $today, function (HabitOccurrence $occurrence, CarbonImmutable $calendarDate): void {
            if ($occurrence->state === HabitOccurrenceState::Skipped) {
                $this->resetOccurrence($occurrence, $calendarDate);

                return;
            }

            if ($occurrence->state === HabitOccurrenceState::Completed) {
                $this->resetOccurrence($occurrence, $calendarDate);

                return;
            }

            $occurrence->update([
                'state' => HabitOccurrenceState::Completed,
                'resolved_at' => now(),
            ]);
        }, HabitType::Boolean);
    }

    public function saveNumericValue(
        User $user,
        Habit $habit,
        CarbonImmutable $date,
        ?string $value,
        ?CarbonImmutable $today = null,
    ): void {
        $this->mutate($user, $habit, $date, $today, function (HabitOccurrence $occurrence, CarbonImmutable $calendarDate) use ($value): void {
            if ($value === null) {
                $this->resetOccurrence($occurrence, $calendarDate);

                return;
            }

            $completed = (float) $value >= (float) $occurrence->target_snapshot;
            $state = $completed
                ? HabitOccurrenceState::Completed
                : $this->unresolvedState($occurrence, $calendarDate);

            $occurrence->update([
                'numeric_value' => $value,
                'state' => $state,
                'resolved_at' => $state === HabitOccurrenceState::Pending || $state === null ? null : now(),
            ]);
        }, HabitType::Numeric);
    }

    public function skip(User $user, Habit $habit, CarbonImmutable $date, ?CarbonImmutable $today = null): void
    {
        $this->mutate($user, $habit, $date, $today, function (HabitOccurrence $occurrence): void {
            if ($occurrence->occurrence_kind !== HabitOccurrenceKind::Required) {
                throw ValidationException::withMessages(['occurrence' => 'Flexible extra days cannot be skipped.']);
            }

            $occurrence->update([
                'state' => HabitOccurrenceState::Skipped,
                'resolved_at' => now(),
            ]);
        });
    }

    public function clear(User $user, Habit $habit, CarbonImmutable $date, ?CarbonImmutable $today = null): void
    {
        $this->mutate(
            $user,
            $habit,
            $date,
            $today,
            fn (HabitOccurrence $occurrence, CarbonImmutable $calendarDate) => $this->resetOccurrence($occurrence, $calendarDate),
        );
    }

    /** @param callable(HabitOccurrence, CarbonImmutable): void $change */
    private function mutate(
        User $user,
        Habit $habit,
        CarbonImmutable $date,
        ?CarbonImmutable $today,
        callable $change,
        ?HabitType $requiredType = null,
    ): void {
        if ($habit->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $calendarDate = ($today ?? $this->userCalendar->today($user))->startOfDay();
        $currentSeason = $this->synchronizeOccurrences->execute($user, $calendarDate);

        DB::transaction(function () use ($habit, $date, $calendarDate, $currentSeason, $change, $requiredType): void {
            $lockedHabit = Habit::query()->lockForUpdate()->findOrFail($habit->id);
            $this->assertEditableDate($lockedHabit, $date, $calendarDate, $currentSeason);

            if ($requiredType !== null && $lockedHabit->type !== $requiredType) {
                throw ValidationException::withMessages(['occurrence' => "This action requires a {$requiredType->value} Habit."]);
            }

            $definition = $this->definitionResolver->forDate($lockedHabit, $date);
            $occurrence = HabitOccurrence::query()
                ->where('habit_id', $lockedHabit->id)
                ->whereDate('occurrence_date', $date)
                ->lockForUpdate()
                ->first();

            if ($occurrence === null) {
                $occurrence = $this->createEligibleOccurrence($lockedHabit, $definition, $currentSeason, $date);
            }

            $change($occurrence, $calendarDate);
            $this->recalculateProgression->execute($lockedHabit, $currentSeason);
        }, 3);
    }

    private function assertEditableDate(Habit $habit, CarbonImmutable $date, CarbonImmutable $today, Season $season): void
    {
        if ($date->isAfter($today)) {
            throw ValidationException::withMessages(['occurrence' => 'Future Habit dates cannot be edited.']);
        }

        if (! $date->betweenIncluded($season->start_date, $season->end_date)) {
            throw ValidationException::withMessages(['occurrence' => 'This Habit occurrence is locked because its Season has ended.']);
        }

        if ($date->isBefore($habit->starts_on)) {
            throw ValidationException::withMessages(['occurrence' => 'This date is before the Habit started.']);
        }
    }

    private function createEligibleOccurrence(
        Habit $habit,
        HabitDefinitionVersion $definition,
        Season $season,
        CarbonImmutable $date,
    ): HabitOccurrence {
        if (! $this->schedule->isFlexibleExtraAvailable($definition, $date)) {
            throw ValidationException::withMessages(['occurrence' => 'This date is not available for this Habit.']);
        }

        return $habit->occurrences()->create([
            'user_id' => $habit->user_id,
            'season_id' => $season->id,
            'occurrence_date' => $date->toDateString(),
            'occurrence_kind' => HabitOccurrenceKind::FlexibleExtra,
            'state' => null,
            'target_snapshot' => $definition->numeric_target,
            'difficulty_snapshot' => $definition->difficulty,
            'schedule_type_snapshot' => $definition->schedule_type,
            'schedule_weekdays_snapshot' => $definition->weekdays,
            'flexible_snapshot' => $definition->flexible,
            'base_reward' => $definition->difficulty->baseReward(),
        ]);
    }

    private function resetOccurrence(HabitOccurrence $occurrence, CarbonImmutable $today): void
    {
        if ($occurrence->occurrence_kind === HabitOccurrenceKind::FlexibleExtra) {
            $occurrence->delete();

            return;
        }

        $state = $this->unresolvedState($occurrence, $today);
        $occurrence->update([
            'state' => $state,
            'numeric_value' => null,
            'resolved_at' => $state === HabitOccurrenceState::Missed ? now() : null,
        ]);
    }

    private function unresolvedState(HabitOccurrence $occurrence, CarbonImmutable $today): ?HabitOccurrenceState
    {
        if ($occurrence->occurrence_kind === HabitOccurrenceKind::FlexibleExtra) {
            return null;
        }

        return $occurrence->occurrence_date->isSameDay($today)
            ? HabitOccurrenceState::Pending
            : HabitOccurrenceState::Missed;
    }
}
