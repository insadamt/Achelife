<?php

namespace App\Data\Portability;

class RestoreResult
{
    /** @param array<string, mixed> $summary */
    public function __construct(
        public readonly array $summary,
        public readonly ?string $safetyArchiveName,
    ) {}
}
