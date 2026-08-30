<?php

namespace App\Data\Money;

use App\Enums\MoneySubscriptionPaymentMode;
use App\Enums\MoneySubscriptionRecurrence;
use Carbon\CarbonImmutable;

readonly class MoneySubscriptionData
{
    public function __construct(
        public string $name,
        public int $amountMinor,
        public int $accountId,
        public int $categoryId,
        public ?int $subcategoryId,
        public ?string $note,
        public CarbonImmutable $startsOn,
        public ?CarbonImmutable $endsOn,
        public MoneySubscriptionRecurrence $recurrence,
        public MoneySubscriptionPaymentMode $paymentMode,
    ) {}
}
