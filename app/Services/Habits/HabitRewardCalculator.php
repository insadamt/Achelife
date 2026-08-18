<?php

namespace App\Services\Habits;

class HabitRewardCalculator
{
    /** @return array{multiplier: float, points: int} */
    public function calculate(int $baseReward, int $streakAfterCompletion): array
    {
        $multiplier = match (true) {
            $streakAfterCompletion >= 20 => 2.0,
            $streakAfterCompletion >= 10 => 1.5,
            default => 1.0,
        };

        return [
            'multiplier' => $multiplier,
            'points' => (int) ($baseReward * $multiplier),
        ];
    }
}
