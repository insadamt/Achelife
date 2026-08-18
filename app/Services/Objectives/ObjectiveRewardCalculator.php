<?php

namespace App\Services\Objectives;

use InvalidArgumentException;

class ObjectiveRewardCalculator
{
    public const MAXIMUM_OBJECTIVES = 3;

    public function rewardPerObjective(int $objectiveCount): int
    {
        return match ($objectiveCount) {
            0 => 0,
            1 => 300,
            2 => 150,
            3 => 100,
            default => throw new InvalidArgumentException('Objective count must be between zero and three.'),
        };
    }
}
