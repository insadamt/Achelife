<?php

namespace App\Actions\Constitution;

use App\Enums\LawSeverity;
use App\Models\Law;
use App\Models\User;

class CreateLaw
{
    public function execute(User $user, string $name, LawSeverity $severity): Law
    {
        return $user->laws()->create([
            'name' => $name,
            'severity' => $severity,
        ]);
    }
}
