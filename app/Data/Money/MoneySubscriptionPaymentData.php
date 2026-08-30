<?php

namespace App\Data\Money;

readonly class MoneySubscriptionPaymentData
{
    public function __construct(
        public int $amountMinor,
        public int $accountId,
        public int $categoryId,
        public ?int $subcategoryId,
        public ?string $note,
        public bool $applyToFuturePayments,
    ) {}
}
