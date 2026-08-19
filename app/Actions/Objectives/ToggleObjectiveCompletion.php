<?php

namespace App\Actions\Objectives;

use App\Models\Objective;
use App\Models\Season;
use App\Services\Calendar\UserCalendar;
use App\Services\Objectives\ObjectiveRewardCalculator;
use App\Services\Seasons\SeasonLifecycle;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class ToggleObjectiveCompletion
{
    public function __construct(
        private readonly SeasonLifecycle $seasonLifecycle,
        private readonly ObjectiveRewardCalculator $rewardCalculator,
        private readonly RebalanceObjectiveRewards $rebalanceRewards,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(Objective $objective, ?CarbonImmutable $today = null): Objective
    {
        $calendarToday = ($today ?? $this->userCalendar->today($objective->season()->firstOrFail()->user()->firstOrFail()))->startOfDay();

        return DB::transaction(function () use ($objective, $calendarToday): Objective {
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($objective->season_id);
            $objectives = $lockedSeason->objectives()
                ->orderBy('creation_order')
                ->lockForUpdate()
                ->get();
            $lockedObjective = $objectives->firstWhere('id', $objective->id);

            abort_unless($lockedObjective instanceof Objective, 404);
            $this->seasonLifecycle->ensureObjectiveCompletionIsMutable($lockedSeason, $calendarToday);

            $previousContribution = $objectives->sum('earned_sp');

            if ($lockedObjective->completed_at === null) {
                $lockedObjective->update([
                    'completed_at' => now(),
                    'earned_sp' => $this->rewardCalculator->rewardPerObjective($objectives->count()),
                ]);
            } else {
                $lockedObjective->update([
                    'completed_at' => null,
                    'earned_sp' => null,
                ]);
            }

            $this->rebalanceRewards->execute($lockedSeason, $objectives, $previousContribution);

            return $lockedObjective->refresh();
        }, 3);
    }
}
