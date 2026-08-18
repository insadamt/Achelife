<?php

namespace App\Support\Progress;

use App\Models\User;
use App\Services\Seasons\SeasonPointsAttributedOnDate;
use App\Support\Seasons\SeasonViewDataFactory;
use Carbon\CarbonImmutable;

class ProgressPanelViewDataFactory
{
    public function __construct(
        private readonly SeasonViewDataFactory $seasonViewDataFactory,
        private readonly SeasonPointsAttributedOnDate $seasonPointsAttributedOnDate,
    ) {}

    /** @return array<string, mixed>|null */
    public function make(User $user, CarbonImmutable $today): ?array
    {
        $season = $user->seasons()
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->with('objectives')
            ->first();

        if ($season === null) {
            return null;
        }

        return [
            'todaySp' => $this->seasonPointsAttributedOnDate->calculate($user, $season, $today),
            'season' => $this->seasonViewDataFactory->forSeason($season, $today),
            'diary' => $this->diary($user, $today),
        ];
    }

    /** @return array<string, mixed> */
    private function diary(User $user, CarbonImmutable $today): array
    {
        $entry = $user->diaryEntries()->whereDate('entry_date', $today)->first();
        $streak = $entry?->is_completed
            ? $entry->streak_after
            : $user->diaryEntries()
                ->whereDate('entry_date', $today->subDay())
                ->where('is_completed', true)
                ->value('streak_after');

        return [
            'state' => $entry?->is_completed ? 'completed' : 'pending',
            'streak' => $streak ?? 0,
            'earnedSp' => $entry?->earned_sp ?? 0,
            'href' => '/diary?date='.$today->toDateString(),
        ];
    }
}
