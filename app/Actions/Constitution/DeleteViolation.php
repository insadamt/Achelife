<?php

namespace App\Actions\Constitution;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Law;
use App\Models\User;
use App\Models\Violation;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteViolation
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeUserSeasons,
        private readonly RecalculateLawViolations $recalculateViolations,
    ) {}

    public function execute(User $user, Violation $violation, ?CarbonImmutable $today = null): void
    {
        if ($violation->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $calendarToday = ($today ?? CarbonImmutable::today())->startOfDay();

        DB::transaction(function () use ($user, $violation, $calendarToday): void {
            $currentSeason = $this->synchronizeUserSeasons->execute($user, $calendarToday);
            $lockedViolation = Violation::query()->lockForUpdate()->findOrFail($violation->id);

            if ($lockedViolation->season_id !== $currentSeason->id) {
                throw ValidationException::withMessages(['violation' => 'Completed Season violations are permanently locked.']);
            }

            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($lockedViolation->law_id);
            $previousPenaltyTotal = $lockedLaw->violations()
                ->where('season_id', $currentSeason->id)
                ->lockForUpdate()
                ->get()
                ->sum('penalty_sp');
            $lockedViolation->delete();
            $this->recalculateViolations->execute($lockedLaw, $currentSeason, $previousPenaltyTotal);
        }, 3);
    }
}
