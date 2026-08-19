<?php

namespace App\Services\Constitution;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Law;
use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

class ViolationDateGuard
{
    public function __construct(private readonly SynchronizeUserSeasons $synchronizeUserSeasons) {}

    public function forNewViolation(User $user, Law $law, CarbonImmutable $date, CarbonImmutable $today): Season
    {
        if ($law->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        if ($law->archived_at !== null) {
            throw ValidationException::withMessages(['law' => 'Archived Laws cannot receive new violations.']);
        }

        return $this->validateDate($user, $law, $date, $today);
    }

    public function forCorrection(User $user, Law $law, CarbonImmutable $date, CarbonImmutable $today): Season
    {
        if ($law->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return $this->validateDate($user, $law, $date, $today);
    }

    private function validateDate(User $user, Law $law, CarbonImmutable $date, CarbonImmutable $today): Season
    {
        $currentSeason = $this->synchronizeUserSeasons->execute($user, $today);

        if ($date->isAfter($today)) {
            throw ValidationException::withMessages(['date' => 'A violation cannot be recorded in the future.']);
        }

        if ($date->isBefore($currentSeason->start_date) || $date->isAfter($currentSeason->end_date)) {
            throw ValidationException::withMessages(['date' => 'Violations can only be recorded in the current Season.']);
        }

        if ($date->isBefore($law->created_on)) {
            throw ValidationException::withMessages(['date' => 'A violation cannot predate the Law.']);
        }

        return $currentSeason;
    }
}
