<?php

namespace App\Data\Money;

use App\Enums\MoneyTransactionType;
use Carbon\CarbonImmutable;

readonly class MoneyTransactionData
{
    public function __construct(
        public MoneyTransactionType $type,
        public int $amountMinor,
        public int $accountId,
        public ?int $destinationAccountId,
        public ?int $categoryId,
        public ?int $subcategoryId,
        public CarbonImmutable $date,
        public ?string $note,
    ) {}
}
