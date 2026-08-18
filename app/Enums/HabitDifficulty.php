<?php

namespace App\Enums;

enum HabitDifficulty: string
{
    case Easy = 'easy';
    case Normal = 'normal';
    case Hard = 'hard';

    public function baseReward(): int
    {
        return match ($this) {
            self::Easy => 2,
            self::Normal => 4,
            self::Hard => 8,
        };
    }
}
