<?php

namespace App\Data\Tasks;

use Carbon\CarbonImmutable;

readonly class ManualFocusSessionData
{
    public function __construct(
        public CarbonImmutable $startedAt,
        public CarbonImmutable $endedAt,
    ) {}
}
