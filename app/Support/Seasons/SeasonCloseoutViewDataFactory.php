<?php

namespace App\Support\Seasons;

use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Models\Season;
use App\Services\Seasons\SeasonRankCalculator;

class SeasonCloseoutViewDataFactory
{
    public function __construct(private readonly SeasonRankCalculator $seasonRankCalculator) {}

    /** @return array<string, mixed> */
    public function make(Season $season): array
    {
        $summary = $this->summary($season);
        $previousSeason = $season->user->seasons()
            ->where('season_number', '<', $season->season_number)
            ->whereNotNull('finalized_at')
            ->latest('season_number')
            ->first();

        return [
            ...$summary,
            'reflection' => $season->reflection ?? '',
            'recapSeenAt' => $season->recap_seen_at?->toIso8601String(),
            'previous' => $previousSeason === null ? null : $this->summary($previousSeason),
        ];
    }

    /** @return array<string, mixed> */
    private function summary(Season $season): array
    {
        $taskSp = (int) $season->rewardedTasks()->sum('earned_sp');
        $habitSp = (int) $season->habitOccurrences()->sum('earned_sp');
        $diarySp = (int) $season->diaryEntries()->sum('earned_sp');
        $objectiveSp = (int) $season->objectives()->sum('earned_sp');
        $constitutionSp = (int) $season->violations()->sum('penalty_sp');
        $scheduledTasks = $season->user->tasks()
            ->whereBetween('scheduled_date', [$season->start_date, $season->end_date]);
        $requiredHabits = $season->habitOccurrences()->where('occurrence_kind', HabitOccurrenceKind::Required);
        $completedHabits = (clone $requiredHabits)->where('state', HabitOccurrenceState::Completed)->count();
        $skippedHabits = (clone $requiredHabits)->where('state', HabitOccurrenceState::Skipped)->count();
        $requiredHabitCount = (clone $requiredHabits)->count();
        $objectiveCount = $season->objectives()->count();

        return [
            'seasonId' => $season->id,
            'seasonNumber' => $season->season_number,
            'startDate' => $season->start_date->toDateString(),
            'endDate' => $season->end_date->toDateString(),
            'seasonPoints' => $season->season_points,
            'rank' => $this->seasonRankCalculator->fromSnapshot(
                $season->rank ?? $this->seasonRankCalculator->calculate($season->season_points)->key,
            )->toArray(),
            'breakdown' => [
                'tasks' => $taskSp,
                'habits' => $habitSp,
                'diary' => $diarySp,
                'objectives' => $objectiveSp,
                'constitution' => $constitutionSp,
            ],
            'metrics' => [
                'objectivesCompleted' => $season->objectives()->whereNotNull('completed_at')->count(),
                'objectivesTotal' => $objectiveCount,
                'tasksResolved' => (clone $scheduledTasks)->whereNotNull('completed_at')->count(),
                'tasksTotal' => (clone $scheduledTasks)->count(),
                'habitsCompleted' => $completedHabits,
                'habitsSkipped' => $skippedHabits,
                'habitsRequired' => $requiredHabitCount,
                'habitAdherencePercent' => $requiredHabitCount === 0 ? 0 : (int) round(($completedHabits / $requiredHabitCount) * 100),
                'diaryDays' => $season->diaryEntries()->where('is_completed', true)->count(),
                'constitutionViolations' => $season->violations()->count(),
                'constitutionSp' => $constitutionSp,
            ],
        ];
    }
}
