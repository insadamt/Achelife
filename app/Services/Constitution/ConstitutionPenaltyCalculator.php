<?php

namespace App\Services\Constitution;

use App\Enums\LawSeverity;
use InvalidArgumentException;

class ConstitutionPenaltyCalculator
{
    public function calculate(int $basePenalty, int $sequenceNumber): int
    {
        $validBasePenalties = array_map(
            fn (LawSeverity $severity): int => $severity->basePenalty(),
            LawSeverity::cases(),
        );

        if (! in_array($basePenalty, $validBasePenalties, true)) {
            throw new InvalidArgumentException('The Constitution base penalty snapshot is invalid.');
        }

        if ($sequenceNumber < 1) {
            throw new InvalidArgumentException('The Constitution violation sequence must be positive.');
        }

        return $basePenalty * $sequenceNumber;
    }
}
