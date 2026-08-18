<?php

namespace App\Support\Habits;

use App\Enums\HabitOccurrenceKind;
use App\Models\Habit;
use App\Models\HabitDefinitionVersion;
use App\Models\HabitOccurrence;
use App\Models\Season;
use App\Services\Habits\HabitDefinitionResolver;
use App\Services\Habits\HabitSchedule;
use Carbon\CarbonImmutable;

class HabitViewDataFactory
{
    public function __construct(
        private readonly HabitDefinitionResolver $definitionResolver,
        private readonly HabitSchedule $schedule,
    ) {}

    /** @return array<string, mixed> */
    public function make(Habit $habit, Season $season, CarbonImmutable $today): array
    {
        $habit->loadMissing('definitionVersions', 'occurrences');
        $todayDefinition = $this->definitionResolver->fromLoadedVersions($habit->definitionVersions, $today);
        $editableDefinition = $habit->definitionVersions
            ->filter(fn (HabitDefinitionVersion $version) => $version->effective_from->lessThanOrEqualTo($today->addDay()))
            ->last() ?? $todayDefinition;
        $occurrences = $habit->occurrences->keyBy(fn (HabitOccurrence $occurrence) => $occurrence->occurrence_date->toDateString());
        $days = [];

        for ($date = $season->start_date; $date->lessThanOrEqualTo($season->end_date); $date = $date->addDay()) {
            $days[] = $this->dayData($habit, $occurrences->get($date->toDateString()), $date, $today, $season);
        }

        return [
            'id' => $habit->id,
            'name' => $habit->name,
            'type' => $habit->type->value,
            'unit' => $habit->unit,
            'startsOn' => $habit->starts_on->toDateString(),
            'currentStreak' => $habit->current_streak,
            'difficulty' => $todayDefinition->difficulty->value,
            'baseReward' => $todayDefinition->difficulty->baseReward(),
            'scheduleType' => $todayDefinition->schedule_type->value,
            'weekdays' => $todayDefinition->weekdays ?? [],
            'flexible' => $todayDefinition->flexible,
            'numericTarget' => $todayDefinition->numeric_target,
            'editDefinition' => $this->definitionData($editableDefinition),
            'changesStartTomorrow' => $editableDefinition->effective_from->isAfter($today),
            'days' => $days,
        ];
    }

    /** @return array<string, mixed> */
    public function makeArchived(Habit $habit): array
    {
        $habit->loadMissing('definitionVersions');
        $definitionDate = $habit->inactive_on ?? $habit->starts_on;
        $definition = $this->definitionResolver->fromLoadedVersions($habit->definitionVersions, $definitionDate);

        return [
            'id' => $habit->id,
            'name' => $habit->name,
            'type' => $habit->type->value,
            'unit' => $habit->unit,
            'startsOn' => $habit->starts_on->toDateString(),
            'archivedAt' => $habit->archived_at?->toIso8601String(),
            'inactiveOn' => $habit->inactive_on?->toDateString(),
            'currentStreak' => $habit->current_streak,
            ...$this->definitionData($definition),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dayData(
        Habit $habit,
        ?HabitOccurrence $occurrence,
        CarbonImmutable $date,
        CarbonImmutable $today,
        Season $season,
    ): array {
        $beforeHabit = $date->isBefore($habit->starts_on);
        $future = $date->isAfter($today);
        $definition = $beforeHabit ? null : $this->definitionResolver->fromLoadedVersions($habit->definitionVersions, $date);
        $required = $definition !== null && $this->schedule->isRequired($definition, $date);
        $flexibleAvailable = $definition !== null && $this->schedule->isFlexibleExtraAvailable($definition, $date);
        $available = ! $beforeHabit && ! $future && ($required || $flexibleAvailable);

        return [
            'date' => $date->toDateString(),
            'seasonDay' => $season->start_date->diffInDays($date) + 1,
            'calendarDay' => $date->day,
            'month' => $date->format('M'),
            'weekday' => $date->isoWeekday(),
            'state' => $occurrence?->state?->value,
            'kind' => $occurrence?->occurrence_kind->value
                ?? ($required ? HabitOccurrenceKind::Required->value : ($flexibleAvailable ? HabitOccurrenceKind::FlexibleExtra->value : null)),
            'numericValue' => $occurrence?->numeric_value,
            'target' => $occurrence?->target_snapshot ?? $definition?->numeric_target,
            'earnedSp' => $occurrence?->earned_sp ?? 0,
            'streakAfter' => $occurrence?->streak_after,
            'multiplier' => $occurrence?->reward_multiplier,
            'available' => $available,
            'clickable' => $available,
            'required' => $required,
            'flexibleExtra' => ! $required && $flexibleAvailable,
            'past' => $date->isBefore($today),
            'today' => $date->isSameDay($today),
            'future' => $future,
        ];
    }

    /** @return array<string, mixed> */
    private function definitionData(HabitDefinitionVersion $definition): array
    {
        return [
            'difficulty' => $definition->difficulty->value,
            'baseReward' => $definition->difficulty->baseReward(),
            'scheduleType' => $definition->schedule_type->value,
            'weekdays' => $definition->weekdays ?? [],
            'flexible' => $definition->flexible,
            'numericTarget' => $definition->numeric_target,
        ];
    }
}
