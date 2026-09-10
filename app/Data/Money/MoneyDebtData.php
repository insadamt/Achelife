<?php

namespace App\Data\Money;

use App\Enums\MoneyDebtDirection;
use Carbon\CarbonImmutable;

readonly class MoneyDebtData
{
    public function __construct(
        public MoneyDebtDirection $direction,
        public int $amountMinor,
        public ?int $personId,
        public ?string $personName,
        public ?string $personNickname,
        public ?int $accountId,
        public string $currency,
        public CarbonImmutable $openedOn,
        public ?CarbonImmutable $dueOn,
        public ?string $note,
    ) {}
}
