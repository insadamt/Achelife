<?php

namespace App\Support\Constitution;

use App\Models\Law;
use App\Models\Violation;

class ConstitutionViewDataFactory
{
    /** @return array<string, mixed> */
    public function makeActiveLaw(Law $law): array
    {
        $law->loadMissing('violations');
        $currentSeasonViolationCount = $law->violations->count();
        $nextMultiplier = $currentSeasonViolationCount + 1;

        return [
            'id' => $law->id,
            'name' => $law->name,
            'severity' => $law->severity->value,
            'basePenalty' => $law->severity->basePenalty(),
            'createdOn' => $law->created_on->toDateString(),
            'violationCount' => $law->violations_count,
            'currentSeasonViolationCount' => $currentSeasonViolationCount,
            'nextMultiplier' => $nextMultiplier,
            'nextPenalty' => $law->severity->basePenalty() * $nextMultiplier,
            'canDelete' => $law->violations_count === 0,
            'violations' => $law->violations
                ->reverse()
                ->values()
                ->map(fn ($violation) => $this->violation($violation)),
        ];
    }

    /** @return array<string, mixed> */
    public function makeArchivedLaw(Law $law): array
    {
        return [
            'id' => $law->id,
            'name' => $law->name,
            'severity' => $law->severity->value,
            'basePenalty' => $law->severity->basePenalty(),
            'archivedAt' => $law->archived_at?->toIso8601String(),
            'violationCount' => $law->violations_count,
        ];
    }

    /** @return array<string, mixed> */
    private function violation(Violation $violation): array
    {
        return [
            'id' => $violation->id,
            'date' => $violation->violation_date->toDateString(),
            'severity' => $violation->severity_snapshot->value,
            'basePenalty' => $violation->base_penalty_snapshot,
            'multiplier' => $violation->sequence_number,
            'penalty' => $violation->penalty_sp,
            'recordedAt' => $violation->created_at->toIso8601String(),
        ];
    }
}
