<?php

namespace App\Actions\Objectives;

use App\Models\Objective;
use App\Models\Season;
use App\Services\Calendar\UserCalendar;
use App\Services\Seasons\SeasonLifecycle;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class DeleteObjective
{
    public function __construct(
        private readonly SeasonLifecycle $seasonLifecycle,
        private readonly RebalanceObjectiveRewards $rebalanceRewards,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(Objective $objective, ?CarbonImmutable $today = null): void
    {
        $calendarToday = ($today ?? $this->userCalendar->today($objective->season()->firstOrFail()->user()->firstOrFail()))->startOfDay();

        DB::transaction(function () use ($objective, $calendarToday): void {
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($objective->season_id);
            $objectives = $lockedSeason->objectives()
                ->orderBy('creation_order')
                ->lockForUpdate()
                ->get();
            $lockedObjective = $objectives->firstWhere('id', $objective->id);

            abort_unless($lockedObjective instanceof Objective, 404);
            $this->seasonLifecycle->ensureObjectiveDefinitionsAreMutable($lockedSeason, $calendarToday);

            $previousContribution = $objectives->sum('earned_sp');
            $lockedObjective->delete();
            $remainingObjectives = $objectives->reject(
                fn (Objective $seasonObjective): bool => $seasonObjective->is($lockedObjective),
            )->values();
            $this->rebalanceRewards->execute($lockedSeason, $remainingObjectives, $previousContribution);
        }, 3);
    }
}
