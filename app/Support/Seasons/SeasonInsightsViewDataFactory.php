<?php

namespace App\Support\Seasons;

use App\Models\Season;
use App\Services\Calendar\UserCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class SeasonInsightsViewDataFactory
{
    public function __construct(
        private readonly SeasonCloseoutViewDataFactory $seasonSummary,
        private readonly UserCalendar $calendar,
    ) {}

    /** @return array<string, mixed> */
    public function make(Season $season, CarbonImmutable $today): array
    {
        $summary = $this->seasonSummary->make($season);
        $elapsedDays = $this->elapsedDays($season, $today);
        $timeline = $this->timeline($season, $elapsedDays);
        $previousSeason = $season->user->seasons()
            ->where('season_number', '<', $season->season_number)
            ->whereNotNull('finalized_at')
            ->latest('season_number')
            ->first();

        return [
            'summary' => $summary,
            'elapsedDays' => $elapsedDays,
            'averageSpPerDay' => $elapsedDays === 0 ? 0 : round($season->season_points / $elapsedDays, 1),
            'spToday' => $timeline === [] ? 0 : $timeline[array_key_last($timeline)]['dailySp'],
            'timeline' => $timeline,
            'previousTimeline' => $previousSeason === null ? null : $this->timeline($previousSeason, 30),
        ];
    }

    private function elapsedDays(Season $season, CarbonImmutable $today): int
    {
        if ($season->finalized_at !== null || $today->greaterThanOrEqualTo($season->end_date)) {
            return 30;
        }

        if ($today->isBefore($season->start_date)) {
            return 0;
        }

        return min(30, (int) $season->start_date->diffInDays($today) + 1);
    }

    /** @return array<int, array{day: int, date: string, label: string, dailySp: int, cumulativeSp: int}> */
    private function timeline(Season $season, int $days): array
    {
        $dailyPoints = array_fill(0, 30, 0);
        $this->addTimestampPoints($dailyPoints, $season, $season->rewardedTasks()->whereNotNull('completed_at')->get(['completed_at', 'earned_sp']), 'completed_at', 'earned_sp');
        $this->addDatePoints($dailyPoints, $season, $season->habitOccurrences()->get(['occurrence_date', 'earned_sp']), 'occurrence_date', 'earned_sp');
        $this->addDatePoints($dailyPoints, $season, $season->diaryEntries()->get(['entry_date', 'earned_sp']), 'entry_date', 'earned_sp');
        $this->addTimestampPoints($dailyPoints, $season, $season->objectives()->whereNotNull('completed_at')->get(['completed_at', 'earned_sp']), 'completed_at', 'earned_sp');
        $this->addDatePoints($dailyPoints, $season, $season->violations()->get(['violation_date', 'penalty_sp']), 'violation_date', 'penalty_sp');

        $cumulativePoints = 0;
        $timeline = [];
        for ($index = 0; $index < $days; $index++) {
            $date = $season->start_date->addDays($index);
            $cumulativePoints += $dailyPoints[$index];
            $timeline[] = [
                'day' => $index + 1,
                'date' => $date->toDateString(),
                'label' => $date->format('M j'),
                'dailySp' => $dailyPoints[$index],
                'cumulativeSp' => $cumulativePoints,
            ];
        }

        return $timeline;
    }

    private function addTimestampPoints(array &$dailyPoints, Season $season, Collection $records, string $dateField, string $pointsField): void
    {
        foreach ($records as $record) {
            $date = $this->calendar->dateOf($season->user, $record->{$dateField});
            $this->addPoints($dailyPoints, $season, $date, (int) ($record->{$pointsField} ?? 0));
        }
    }

    private function addDatePoints(array &$dailyPoints, Season $season, Collection $records, string $dateField, string $pointsField): void
    {
        foreach ($records as $record) {
            $this->addPoints($dailyPoints, $season, $record->{$dateField}, (int) ($record->{$pointsField} ?? 0));
        }
    }

    private function addPoints(array &$dailyPoints, Season $season, CarbonImmutable $date, int $points): void
    {
        $index = (int) $season->start_date->diffInDays($date, false);
        if ($index >= 0 && $index < 30) {
            $dailyPoints[$index] += $points;
        }
    }
}
