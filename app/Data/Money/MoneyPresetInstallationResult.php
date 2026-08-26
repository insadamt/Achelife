<?php

namespace App\Data\Money;

readonly class MoneyPresetInstallationResult
{
    public function __construct(
        public int $categoriesCreated,
        public int $subcategoriesCreated,
    ) {}
}
