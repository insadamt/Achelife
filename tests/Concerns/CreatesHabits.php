<?php

namespace Tests\Concerns;

use App\Actions\Habits\CreateHabit;
use App\Data\Habits\HabitData;
use App\Enums\HabitDifficulty;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Models\Habit;
use App\Models\User;
use Carbon\CarbonImmutable;

trait CreatesHabits
{
    protected function userCreatedOn(string $date): User
    {
        return User::factory()->create([
            'created_at' => CarbonImmutable::parse($date),
            'updated_at' => CarbonImmutable::parse($date),
        ]);
    }

    /** @param list<int> $weekdays */
    protected function createHabit(
        User $user,
        string $date,
        HabitType $type = HabitType::Boolean,
        HabitDifficulty $difficulty = HabitDifficulty::Normal,
        HabitScheduleType $schedule = HabitScheduleType::EveryDay,
        array $weekdays = [],
        bool $flexible = false,
        ?string $target = null,
        ?string $unit = null,
        string $name = 'Test Habit',
    ): Habit {
        return app(CreateHabit::class)->execute($user, new HabitData(
            name: $name,
            type: $type,
            unit: $unit,
            difficulty: $difficulty,
            scheduleType: $schedule,
            weekdays: $weekdays,
            flexible: $flexible,
            numericTarget: $target,
        ), CarbonImmutable::parse($date));
    }
}
