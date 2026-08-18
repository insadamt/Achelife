<?php

namespace App\Support\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\Season;
use App\Services\Objectives\ObjectiveRewardCalculator;
use App\Services\Seasons\SeasonLifecycle;
use App\Services\Seasons\SeasonRankCalculator;
use Carbon\CarbonImmutable;

class SeasonViewDataFactory
{
    public function __construct(
        private readonly SeasonLifecycle $seasonLifecycle,
        private readonly ObjectiveRewardCalculator $objectiveRewardCalculator,
        private readonly SeasonRankCalculator $seasonRankCalculator,
    ) {}

    /** @return array<string, mixed> */
    public function forSeason(Season $season, CarbonImmutable $today): array
    {
        $isCurrent = $this->seasonLifecycle->isActive($season, $today);
        $day = $this->seasonLifecycle->day($season, $today);
        $objectives = $season->relationLoaded('objectives')
            ? $season->objectives
            : $season->objectives()->orderBy('creation_order')->get();
        $objectiveCount = $objectives->count();
        $rewardPerObjective = $this->objectiveRewardCalculator->rewardPerObjective($objectiveCount);
        $setupIsOpen = $this->seasonLifecycle->objectiveSetupIsOpen($season, $today);
        $rank = $isCurrent
            ? $this->seasonRankCalculator->calculate($season->season_points)
            : $this->seasonRankCalculator->fromSnapshot(
                $season->rank ?? $this->seasonRankCalculator->calculate($season->season_points)->key,
            );

        return [
            'id' => $season->id,
            'number' => $season->season_number,
            'state' => $isCurrent ? 'current' : 'completed',
            'startDate' => $season->start_date->toDateString(),
            'endDate' => $season->end_date->toDateString(),
            'day' => $day,
            'progressPercentage' => $isCurrent ? (int) round(($day / SynchronizeUserSeasons::DAYS_PER_SEASON) * 100) : 100,
            'seasonPoints' => $season->season_points,
            'rank' => $rank->toArray(),
            'objectives' => $objectives->values()->map(fn ($objective, int $index): array => [
                'id' => $objective->id,
                'title' => $objective->title,
                'order' => $index + 1,
                'creationOrder' => $objective->creation_order,
                'completed' => $objective->completed_at !== null,
                'completedAt' => $objective->completed_at?->toIso8601String(),
                'earnedSp' => $objective->earned_sp,
                'rewardSp' => $objective->earned_sp ?? $rewardPerObjective,
            ]),
            'objectiveCount' => $objectiveCount,
            'objectiveCompletedCount' => $objectives->whereNotNull('completed_at')->count(),
            'objectiveEarnedSp' => $objectives->sum('earned_sp'),
            'objectiveRewardPerObjective' => $rewardPerObjective,
            'objectiveRewardMaximum' => $objectiveCount === 0 ? 0 : 300,
            'objectiveSetupOpen' => $setupIsOpen,
            'objectiveSetupDaysRemaining' => $setupIsOpen ? max(0, SeasonLifecycle::OBJECTIVE_SETUP_DAYS - (int) $day) : 0,
            'objectiveCompletionMutable' => $isCurrent,
        ];
    }

    /** @return array<string, mixed> */
    public function lockedPlaceholder(Season $currentSeason, int $offset): array
    {
        $startDate = $currentSeason->start_date->addDays($offset * SynchronizeUserSeasons::DAYS_PER_SEASON);

        return [
            'id' => null,
            'number' => $currentSeason->season_number + $offset,
            'state' => 'locked',
            'startDate' => $startDate->toDateString(),
            'endDate' => $startDate->addDays(SynchronizeUserSeasons::DAYS_PER_SEASON - 1)->toDateString(),
            'day' => null,
            'progressPercentage' => 0,
            'seasonPoints' => 0,
            'rank' => null,
            'objectives' => [],
            'objectiveCount' => 0,
            'objectiveCompletedCount' => 0,
            'objectiveEarnedSp' => 0,
            'objectiveRewardPerObjective' => 0,
            'objectiveRewardMaximum' => 0,
            'objectiveSetupOpen' => false,
            'objectiveSetupDaysRemaining' => 0,
            'objectiveCompletionMutable' => false,
        ];
    }
}
