<?php

namespace App\Actions\Diary;

use App\Models\DiaryEntry;
use App\Models\Season;
use App\Models\User;
use App\Services\Diary\DiaryRewardCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RecalculateDiaryProgression
{
    public function __construct(private readonly DiaryRewardCalculator $rewardCalculator) {}

    public function execute(User $user, Season $currentSeason, CarbonImmutable $today): void
    {
        DB::transaction(function () use ($user, $currentSeason, $today): void {
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($currentSeason->id);
            $entries = DiaryEntry::query()
                ->where('user_id', $user->id)
                ->where('season_id', $lockedSeason->id)
                ->orderBy('entry_date')
                ->lockForUpdate()
                ->get()
                ->keyBy(fn (DiaryEntry $entry): string => $entry->entry_date->toDateString());
            $previousReward = $entries->sum('earned_sp');
            $streak = $this->baselineStreak($user, $lockedSeason);
            $recalculatedReward = 0;
            $replayThrough = $today->min($lockedSeason->end_date);

            for ($date = $lockedSeason->start_date; $date->lessThanOrEqualTo($replayThrough); $date = $date->addDay()) {
                $entry = $entries->get($date->toDateString());

                if ($entry?->is_completed) {
                    $streak++;
                    $reward = $this->rewardCalculator->calculate($streak);
                    $entry->fill([
                        'streak_after' => $streak,
                        'reward_multiplier' => $reward['multiplier'],
                        'earned_sp' => $reward['points'],
                    ]);
                    $recalculatedReward += $reward['points'];
                } elseif ($date->isBefore($today)) {
                    $streak = 0;
                    $entry?->fill(['streak_after' => 0, 'reward_multiplier' => 0, 'earned_sp' => 0]);
                } else {
                    $entry?->fill(['streak_after' => $streak, 'reward_multiplier' => 0, 'earned_sp' => 0]);
                }

                if ($entry?->isDirty()) {
                    $entry->save();
                }
            }

            $delta = $recalculatedReward - $previousReward;
            $newSeasonPoints = $lockedSeason->season_points + $delta;

            if ($newSeasonPoints < 0) {
                throw new RuntimeException('Season SP cannot cover the Diary reward recalculation delta.');
            }

            if ($delta !== 0) {
                $lockedSeason->update(['season_points' => $newSeasonPoints]);
            }
        }, 3);
    }

    private function baselineStreak(User $user, Season $season): int
    {
        $previousDate = $season->start_date->subDay();
        $entry = $user->diaryEntries()->whereDate('entry_date', $previousDate)->lockForUpdate()->first();

        return $entry?->is_completed ? $entry->streak_after : 0;
    }
}
