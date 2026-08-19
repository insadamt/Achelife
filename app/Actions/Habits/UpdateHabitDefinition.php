<?php

namespace App\Actions\Habits;

use App\Data\Habits\HabitData;
use App\Models\Habit;
use App\Services\Calendar\UserCalendar;
use App\Services\Habits\HabitDefinitionResolver;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateHabitDefinition
{
    public function __construct(
        private readonly HabitDefinitionResolver $definitionResolver,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(Habit $habit, HabitData $data, ?CarbonImmutable $today = null): Habit
    {
        $calendarDate = ($today ?? $this->userCalendar->today($habit->user()->firstOrFail()))->startOfDay();

        return DB::transaction(function () use ($habit, $data, $calendarDate): Habit {
            $lockedHabit = Habit::query()->lockForUpdate()->findOrFail($habit->id);

            if ($lockedHabit->type !== $data->type) {
                throw ValidationException::withMessages(['type' => 'A Habit type cannot be changed after creation.']);
            }

            $lockedHabit->update([
                'name' => $data->name,
                'unit' => $data->unit,
            ]);

            $tomorrow = $calendarDate->addDay();
            $currentDefinition = $this->definitionResolver->forDate($lockedHabit, $calendarDate);
            $tomorrowDefinition = $lockedHabit->definitionVersions()->firstOrNew(['effective_from' => $tomorrow]);
            $tomorrowDefinition->fill([
                'difficulty' => $data->difficulty,
                'schedule_type' => $data->scheduleType,
                'weekdays' => $data->weekdays,
                'flexible' => $data->flexible,
                'numeric_target' => $data->numericTarget,
            ]);

            $configurationChanged = $currentDefinition->difficulty !== $data->difficulty
                || $currentDefinition->schedule_type !== $data->scheduleType
                || ($currentDefinition->weekdays ?? []) !== $data->weekdays
                || $currentDefinition->flexible !== $data->flexible
                || (float) $currentDefinition->numeric_target !== (float) $data->numericTarget;

            if ($configurationChanged || $tomorrowDefinition->exists) {
                $tomorrowDefinition->save();
            }

            return $lockedHabit->refresh()->load('definitionVersions');
        }, 3);
    }
}
