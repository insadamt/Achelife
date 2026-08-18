<?php

namespace App\Actions\Constitution;

use App\Models\Law;
use App\Models\User;
use App\Models\Violation;
use App\Services\Constitution\ViolationDateGuard;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class RecordViolation
{
    public function __construct(
        private readonly ViolationDateGuard $dateGuard,
        private readonly RecalculateLawViolations $recalculateViolations,
    ) {}

    public function execute(User $user, Law $law, CarbonImmutable $date, ?CarbonImmutable $today = null): Violation
    {
        $calendarToday = ($today ?? CarbonImmutable::today())->startOfDay();

        return DB::transaction(function () use ($user, $law, $date, $calendarToday): Violation {
            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($law->id);
            $currentSeason = $this->dateGuard->forNewViolation($user, $lockedLaw, $date, $calendarToday);
            $previousPenaltyTotal = $lockedLaw->violations()
                ->where('season_id', $currentSeason->id)
                ->lockForUpdate()
                ->get()
                ->sum('penalty_sp');
            $violation = $lockedLaw->violations()->create([
                'user_id' => $user->id,
                'season_id' => $currentSeason->id,
                'violation_date' => $date,
                'severity_snapshot' => $lockedLaw->severity,
                'base_penalty_snapshot' => $lockedLaw->severity->basePenalty(),
                'sequence_number' => 1,
                'penalty_sp' => $lockedLaw->severity->basePenalty(),
            ]);

            $this->recalculateViolations->execute($lockedLaw, $currentSeason, $previousPenaltyTotal);

            return $violation->refresh();
        }, 3);
    }
}
