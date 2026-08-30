<?php

namespace App\Data\Portability;

class ValidatedArchive
{
    /** @param array<string, mixed> $manifest */
    public function __construct(
        public readonly string $path,
        public readonly array $manifest,
    ) {}
}
