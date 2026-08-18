<?php

namespace App\Actions\Objectives;

use App\Models\Objective;
use App\Models\Season;
use App\Services\Seasons\SeasonLifecycle;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class RenameObjective
{
    public function __construct(private readonly SeasonLifecycle $seasonLifecycle) {}

    public function execute(Objective $objective, string $title, ?CarbonImmutable $today = null): Objective
    {
        $calendarToday = ($today ?? CarbonImmutable::today())->startOfDay();

        return DB::transaction(function () use ($objective, $title, $calendarToday): Objective {
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($objective->season_id);
            $lockedObjective = Objective::query()
                ->where('season_id', $lockedSeason->id)
                ->lockForUpdate()
                ->findOrFail($objective->id);

            $this->seasonLifecycle->ensureObjectiveDefinitionsAreMutable($lockedSeason, $calendarToday);
            $lockedObjective->update(['title' => $title]);

            return $lockedObjective->refresh();
        }, 3);
    }
}
