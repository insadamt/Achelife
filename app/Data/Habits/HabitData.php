<?php

namespace App\Data\Habits;

use App\Enums\HabitDifficulty;
use App\Enums\HabitIcon;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;

readonly class HabitData
{
    /** @param list<int> $weekdays */
    public function __construct(
        public string $name,
        public HabitType $type,
        public ?string $unit,
        public HabitDifficulty $difficulty,
        public HabitScheduleType $scheduleType,
        public array $weekdays,
        public bool $flexible,
        public ?string $numericTarget,
        public HabitIcon $icon = HabitIcon::Check,
    ) {}

    /** @param array<string, mixed> $validated */
    public static function fromValidated(array $validated): self
    {
        $type = HabitType::from($validated['type']);
        $scheduleType = HabitScheduleType::from($validated['schedule_type']);
        $weekdays = $scheduleType === HabitScheduleType::SelectedWeekdays
            ? array_values(array_map('intval', $validated['weekdays']))
            : [];
        sort($weekdays);

        return new self(
            name: trim($validated['name']),
            icon: HabitIcon::tryFrom($validated['icon'] ?? '') ?? HabitIcon::Check,
            type: $type,
            unit: $type === HabitType::Numeric ? trim($validated['unit']) : null,
            difficulty: HabitDifficulty::from($validated['difficulty']),
            scheduleType: $scheduleType,
            weekdays: $weekdays,
            flexible: $scheduleType === HabitScheduleType::SelectedWeekdays && (bool) ($validated['flexible'] ?? false),
            numericTarget: $type === HabitType::Numeric ? (string) $validated['numeric_target'] : null,
        );
    }
}
