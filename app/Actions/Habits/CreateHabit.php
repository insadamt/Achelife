<?php

namespace App\Actions\Habits;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Data\Habits\HabitData;
use App\Models\Habit;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class CreateHabit
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeUserSeasons,
        private readonly SynchronizeHabitOccurrences $synchronizeOccurrences,
    ) {}

    public function execute(User $user, HabitData $data, ?CarbonImmutable $today = null): Habit
    {
        $calendarDate = ($today ?? CarbonImmutable::today())->startOfDay();
        $currentSeason = $this->synchronizeUserSeasons->execute($user, $calendarDate);

        $habit = DB::transaction(function () use ($user, $data, $calendarDate): Habit {
            $habit = $user->habits()->create([
                'name' => $data->name,
                'type' => $data->type,
                'unit' => $data->unit,
                'starts_on' => $calendarDate,
            ]);

            $habit->definitionVersions()->create([
                'effective_from' => $calendarDate,
                'difficulty' => $data->difficulty,
                'schedule_type' => $data->scheduleType,
                'weekdays' => $data->weekdays,
                'flexible' => $data->flexible,
                'numeric_target' => $data->numericTarget,
            ]);

            return $habit;
        }, 3);

        $seasons = $user->seasons()->orderBy('start_date')->get();
        $this->synchronizeOccurrences->synchronizeHabit($habit, $calendarDate, $currentSeason, $seasons);

        return $habit->refresh()->load('definitionVersions', 'occurrences');
    }
}
