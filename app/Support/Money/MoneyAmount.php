<?php

namespace App\Support\Money;

use InvalidArgumentException;

class MoneyAmount
{
    public function toMinorUnits(string $amount, bool $allowNegative = false): int
    {
        $normalized = trim($amount);
        $pattern = $allowNegative ? '/^-?\d{1,12}(?:\.\d{1,2})?$/' : '/^\d{1,12}(?:\.\d{1,2})?$/';

        if (preg_match($pattern, $normalized) !== 1) {
            throw new InvalidArgumentException('The amount must use at most two decimal places.');
        }

        $negative = str_starts_with($normalized, '-');
        $unsigned = ltrim($normalized, '-');
        [$whole, $fraction] = array_pad(explode('.', $unsigned, 2), 2, '');
        $minor = ((int) $whole * 100) + (int) str_pad($fraction, 2, '0');

        return $negative ? -$minor : $minor;
    }
}
