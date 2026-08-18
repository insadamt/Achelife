<?php

namespace App\Services\Tasks;

use App\Data\Tasks\TaskRewardResult;
use App\Enums\TaskCompletionTiming;
use Carbon\CarbonInterface;

class TaskRewardCalculator
{
    public function calculate(bool $important, CarbonInterface $scheduledDate, CarbonInterface $completionDate): TaskRewardResult
    {
        $timing = match (true) {
            $scheduledDate->isAfter($completionDate) => TaskCompletionTiming::Early,
            $scheduledDate->isSameDay($completionDate) => TaskCompletionTiming::OnTime,
            default => TaskCompletionTiming::Late,
        };

        $urgent = $timing !== TaskCompletionTiming::Early;
        $baseReward = match (true) {
            $important && ! $urgent => 16,
            $important && $urgent => 8,
            ! $important && $urgent => 4,
            default => 2,
        };

        return new TaskRewardResult(
            points: $timing === TaskCompletionTiming::Late ? intdiv($baseReward, 2) : $baseReward,
            timing: $timing,
            important: $important,
            urgent: $urgent,
        );
    }
}
