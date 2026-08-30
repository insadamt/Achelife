<?php

namespace App\Data\Money;

readonly class MoneySelectionSnapshot
{
    public function __construct(
        public int $accountId,
        public ?int $destinationAccountId,
        public ?int $categoryId,
        public ?int $subcategoryId,
    ) {}
}
