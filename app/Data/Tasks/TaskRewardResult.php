<?php

namespace App\Data\Tasks;

use App\Enums\TaskCompletionTiming;

readonly class TaskRewardResult
{
    public function __construct(
        public int $points,
        public TaskCompletionTiming $timing,
        public bool $important,
        public bool $urgent,
    ) {}
}
