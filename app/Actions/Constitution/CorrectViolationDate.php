<?php

namespace App\Actions\Constitution;

use App\Models\Law;
use App\Models\User;
use App\Models\Violation;
use App\Services\Calendar\UserCalendar;
use App\Services\Constitution\ViolationDateGuard;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CorrectViolationDate
{
    public function __construct(
        private readonly ViolationDateGuard $dateGuard,
        private readonly RecalculateLawViolations $recalculateViolations,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, Violation $violation, CarbonImmutable $date, ?CarbonImmutable $today = null): Violation
    {
        if ($violation->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $calendarToday = ($today ?? $this->userCalendar->today($user))->startOfDay();

        return DB::transaction(function () use ($user, $violation, $date, $calendarToday): Violation {
            $lockedViolation = Violation::query()->lockForUpdate()->findOrFail($violation->id);
            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($lockedViolation->law_id);
            $currentSeason = $this->dateGuard->forCorrection($user, $lockedLaw, $date, $calendarToday);

            if ($lockedViolation->season_id !== $currentSeason->id) {
                throw ValidationException::withMessages(['violation' => 'Completed Season violations are permanently locked.']);
            }

            $previousPenaltyTotal = $lockedLaw->violations()
                ->where('season_id', $currentSeason->id)
                ->lockForUpdate()
                ->get()
                ->sum('penalty_sp');
            $lockedViolation->update(['violation_date' => $date]);
            $this->recalculateViolations->execute($lockedLaw, $currentSeason, $previousPenaltyTotal);

            return $lockedViolation->refresh();
        }, 3);
    }
}
