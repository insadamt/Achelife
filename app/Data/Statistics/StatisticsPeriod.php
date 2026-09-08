<?php

namespace App\Data\Statistics;

use Carbon\CarbonImmutable;

readonly class StatisticsPeriod
{
    public function __construct(
        public string $key,
        public ?CarbonImmutable $start,
        public CarbonImmutable $end,
        public ?CarbonImmutable $previousStart,
        public ?CarbonImmutable $previousEnd,
        public string $label,
        public ?string $comparisonLabel,
        public ?string $selectionValue,
        public ?string $previousSelectionValue,
        public ?string $nextSelectionValue,
    ) {}
}
