<?php

namespace App\Services\Diary;

class DiaryRewardCalculator
{
    /** @return array{multiplier: float, points: int} */
    public function calculate(int $streak): array
    {
        $multiplier = $streak >= 20 ? 2.0 : ($streak >= 10 ? 1.5 : 1.0);

        return ['multiplier' => $multiplier, 'points' => (int) round(4 * $multiplier)];
    }
}
