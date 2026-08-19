<?php

namespace App\Actions\Objectives;

use App\Models\Objective;
use App\Models\Season;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Objectives\ObjectiveRewardCalculator;
use App\Services\Seasons\SeasonLifecycle;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateObjective
{
    public function __construct(
        private readonly SeasonLifecycle $seasonLifecycle,
        private readonly RebalanceObjectiveRewards $rebalanceRewards,
        private readonly UserCalendar $userCalendar,
    ) {}

    public function execute(User $user, Season $season, string $title, ?CarbonImmutable $today = null): Objective
    {
        $calendarToday = ($today ?? $this->userCalendar->today($user))->startOfDay();

        return DB::transaction(function () use ($user, $season, $title, $calendarToday): Objective {
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($season->id);

            if ($lockedSeason->user_id !== $user->id) {
                abort(403);
            }

            $this->seasonLifecycle->ensureObjectiveDefinitionsAreMutable($lockedSeason, $calendarToday);
            $objectives = $lockedSeason->objectives()
                ->orderBy('creation_order')
                ->lockForUpdate()
                ->get();
            $latestCreationOrder = (int) $lockedSeason->objectives()
                ->withTrashed()
                ->max('creation_order');

            if ($objectives->count() >= ObjectiveRewardCalculator::MAXIMUM_OBJECTIVES) {
                throw ValidationException::withMessages([
                    'objective' => 'A Season can contain at most three Objectives.',
                ]);
            }

            $previousContribution = $objectives->sum('earned_sp');
            $objective = $lockedSeason->objectives()->create([
                'user_id' => $user->id,
                'title' => $title,
                'creation_order' => $latestCreationOrder + 1,
            ]);
            $objectives->push($objective);
            $this->rebalanceRewards->execute($lockedSeason, $objectives, $previousContribution);

            return $objective->refresh();
        }, 3);
    }
}
