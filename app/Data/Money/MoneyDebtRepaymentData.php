<?php

namespace App\Data\Money;

use Carbon\CarbonImmutable;

readonly class MoneyDebtRepaymentData
{
    public function __construct(
        public int $amountMinor,
        public ?int $accountId,
        public CarbonImmutable $settledOn,
        public ?string $note,
    ) {}
}
