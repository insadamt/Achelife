<?php

namespace Tests\Concerns;

use App\Actions\Constitution\CreateLaw;
use App\Actions\Constitution\RecordViolation;
use App\Enums\LawSeverity;
use App\Models\Law;
use App\Models\User;
use App\Models\Violation;
use Carbon\CarbonImmutable;

trait CreatesConstitution
{
    protected function constitutionUserCreatedOn(string $date): User
    {
        return User::factory()->create([
            'created_at' => CarbonImmutable::parse($date),
            'updated_at' => CarbonImmutable::parse($date),
        ]);
    }

    protected function createLaw(
        User $user,
        LawSeverity $severity = LawSeverity::Major,
        string $name = 'Test Law',
        string $createdOn = '2026-08-01',
    ): Law {
        CarbonImmutable::setTestNow("{$createdOn} 09:00:00");

        return app(CreateLaw::class)->execute($user, $name, $severity);
    }

    protected function recordViolation(User $user, Law $law, string $date, ?string $today = null): Violation
    {
        return app(RecordViolation::class)->execute(
            $user,
            $law,
            CarbonImmutable::parse($date),
            CarbonImmutable::parse($today ?? $date),
        );
    }
}
