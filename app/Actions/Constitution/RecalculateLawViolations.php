<?php

namespace App\Actions\Constitution;

use App\Models\Law;
use App\Models\Season;
use App\Services\Constitution\ConstitutionPenaltyCalculator;
use Illuminate\Support\Facades\DB;

class RecalculateLawViolations
{
    public function __construct(private readonly ConstitutionPenaltyCalculator $penaltyCalculator) {}

    public function execute(Law $law, Season $season, int $previousPenaltyTotal): void
    {
        DB::transaction(function () use ($law, $season, $previousPenaltyTotal): void {
            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($law->id);
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($season->id);
            $violations = $lockedLaw->violations()
                ->where('season_id', $lockedSeason->id)
                ->orderBy('violation_date')
                ->orderBy('created_at')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();
            $recalculatedPenaltyTotal = 0;

            foreach ($violations as $index => $violation) {
                $sequenceNumber = $index + 1;
                $penalty = $this->penaltyCalculator->calculate(
                    $violation->base_penalty_snapshot,
                    $sequenceNumber,
                );
                $recalculatedPenaltyTotal += $penalty;
                $violation->fill([
                    'sequence_number' => $sequenceNumber,
                    'penalty_sp' => $penalty,
                ]);

                if ($violation->isDirty()) {
                    $violation->save();
                }
            }

            $constitutionDelta = $recalculatedPenaltyTotal - $previousPenaltyTotal;

            if ($constitutionDelta !== 0) {
                $lockedSeason->update([
                    'season_points' => $lockedSeason->season_points + $constitutionDelta,
                ]);
            }
        }, 3);
    }
}
