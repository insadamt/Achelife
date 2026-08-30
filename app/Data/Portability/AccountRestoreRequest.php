<?php

namespace App\Data\Portability;

class AccountRestoreRequest
{
    public function __construct(
        public readonly bool $freshInstall,
        public readonly ?string $literalConfirmation = null,
    ) {}
}
