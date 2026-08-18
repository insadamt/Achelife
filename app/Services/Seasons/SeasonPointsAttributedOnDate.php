<?php

namespace App\Services\Seasons;

use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;

class SeasonPointsAttributedOnDate
{
    public function calculate(User $user, Season $season, CarbonImmutable $date): int
    {
        $taskPoints = $user->tasks()
            ->where('reward_season_id', $season->id)
            ->whereDate('completed_at', $date)
            ->sum('earned_sp');
        $habitPoints = $user->habitOccurrences()
            ->where('season_id', $season->id)
            ->whereDate('occurrence_date', $date)
            ->sum('earned_sp');
        $diaryPoints = $user->diaryEntries()
            ->where('season_id', $season->id)
            ->whereDate('entry_date', $date)
            ->sum('earned_sp');
        $objectivePoints = $user->objectives()
            ->where('season_id', $season->id)
            ->whereDate('completed_at', $date)
            ->sum('earned_sp');
        $violationPoints = $user->violations()
            ->where('season_id', $season->id)
            ->whereDate('violation_date', $date)
            ->sum('penalty_sp');

        return (int) ($taskPoints + $habitPoints + $diaryPoints + $objectivePoints + $violationPoints);
    }
}
