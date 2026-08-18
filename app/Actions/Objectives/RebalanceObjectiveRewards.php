<?php

namespace App\Actions\Objectives;

use App\Models\Objective;
use App\Models\Season;
use App\Services\Objectives\ObjectiveRewardCalculator;
use Illuminate\Database\Eloquent\Collection;

class RebalanceObjectiveRewards
{
    public function __construct(private readonly ObjectiveRewardCalculator $rewardCalculator) {}

    /** @param Collection<int, Objective> $objectives */
    public function execute(Season $season, Collection $objectives, int $previousContribution): void
    {
        $rewardPerObjective = $this->rewardCalculator->rewardPerObjective($objectives->count());
        $rebalancedContribution = 0;

        foreach ($objectives as $objective) {
            $earnedSp = $objective->completed_at === null ? null : $rewardPerObjective;
            $objective->fill(['earned_sp' => $earnedSp]);

            if ($objective->isDirty()) {
                $objective->save();
            }

            $rebalancedContribution += $earnedSp ?? 0;
        }

        $objectiveDelta = $rebalancedContribution - $previousContribution;

        if ($objectiveDelta !== 0) {
            $season->update([
                'season_points' => $season->season_points + $objectiveDelta,
            ]);
        }
    }
}
