<?php

namespace App\Actions\Habits;

use App\Enums\HabitOccurrenceState;
use App\Models\Habit;
use App\Models\HabitOccurrence;
use App\Models\Season;
use App\Services\Habits\HabitRewardCalculator;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RecalculateHabitProgression
{
    public function __construct(private readonly HabitRewardCalculator $rewardCalculator) {}

    public function execute(Habit $habit, Season $currentSeason): Habit
    {
        return DB::transaction(function () use ($habit, $currentSeason): Habit {
            $lockedHabit = Habit::withTrashed()->lockForUpdate()->findOrFail($habit->id);
            $lockedSeason = Season::query()->lockForUpdate()->findOrFail($currentSeason->id);
            $baselineOccurrence = HabitOccurrence::query()
                ->where('habit_id', $lockedHabit->id)
                ->whereDate('occurrence_date', '<', $lockedSeason->start_date)
                ->latest('occurrence_date')
                ->lockForUpdate()
                ->first();
            $streak = $baselineOccurrence?->streak_after ?? 0;
            $occurrences = HabitOccurrence::query()
                ->where('habit_id', $lockedHabit->id)
                ->where('season_id', $lockedSeason->id)
                ->orderBy('occurrence_date')
                ->lockForUpdate()
                ->get();
            $previousHabitReward = $occurrences->sum('earned_sp');
            $recalculatedHabitReward = 0;

            foreach ($occurrences as $occurrence) {
                [$streak, $multiplier, $earnedSp] = $this->progressOccurrence($occurrence, $streak);
                $recalculatedHabitReward += $earnedSp;

                $occurrence->fill([
                    'streak_after' => $streak,
                    'reward_multiplier' => $multiplier,
                    'earned_sp' => $earnedSp,
                ]);

                if ($occurrence->isDirty()) {
                    $occurrence->save();
                }
            }

            $seasonPointDelta = $recalculatedHabitReward - $previousHabitReward;
            $newSeasonPoints = $lockedSeason->season_points + $seasonPointDelta;

            if ($newSeasonPoints < 0) {
                throw new RuntimeException('Season SP cannot cover the Habit reward recalculation delta.');
            }

            if ($seasonPointDelta !== 0) {
                $lockedSeason->update(['season_points' => $newSeasonPoints]);
            }

            if ($lockedHabit->current_streak !== $streak) {
                $lockedHabit->update(['current_streak' => $streak]);
            }

            return $lockedHabit->refresh();
        }, 3);
    }

    /** @return array{int, float, int} */
    private function progressOccurrence(HabitOccurrence $occurrence, int $streak): array
    {
        return match ($occurrence->state) {
            HabitOccurrenceState::Completed => $this->completedProgress($occurrence, $streak + 1),
            HabitOccurrenceState::Missed => [0, 0.0, 0],
            HabitOccurrenceState::Skipped,
            HabitOccurrenceState::Pending,
            null => [$streak, 0.0, 0],
        };
    }

    /** @return array{int, float, int} */
    private function completedProgress(HabitOccurrence $occurrence, int $streak): array
    {
        $reward = $this->rewardCalculator->calculate($occurrence->base_reward, $streak);

        return [$streak, $reward['multiplier'], $reward['points']];
    }
}
