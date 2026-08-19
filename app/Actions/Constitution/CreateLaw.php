<?php

namespace App\Actions\Constitution;

use App\Enums\LawSeverity;
use App\Models\Law;
use App\Models\User;
use App\Services\Calendar\UserCalendar;

class CreateLaw
{
    public function __construct(private readonly UserCalendar $userCalendar) {}

    public function execute(User $user, string $name, LawSeverity $severity): Law
    {
        return $user->laws()->create([
            'name' => $name,
            'severity' => $severity,
            'created_on' => $this->userCalendar->today($user),
        ]);
    }
}
