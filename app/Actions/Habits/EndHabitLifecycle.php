<?php

namespace App\Actions\Habits;

use App\Models\Habit;
use App\Models\HabitOccurrence;
use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class EndHabitLifecycle
{
    public function __construct(
        private readonly SynchronizeHabitOccurrences $synchronizeOccurrences,
        private readonly RecalculateHabitProgression $recalculateProgression,
    ) {}

    public function archive(User $user, Habit $habit, ?CarbonImmutable $today = null): void
    {
        $this->end($user, $habit, false, $today);
    }

    public function delete(User $user, Habit $habit, ?CarbonImmutable $today = null): void
    {
        $this->end($user, $habit, true, $today);
    }

    private function end(User $user, Habit $habit, bool $delete, ?CarbonImmutable $today): void
    {
        if ($habit->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        $calendarDate = ($today ?? CarbonImmutable::today())->startOfDay();
        $currentSeason = $this->synchronizeOccurrences->execute($user, $calendarDate);

        DB::transaction(function () use ($habit, $delete, $calendarDate, $currentSeason): void {
            $lockedHabit = Habit::query()->lockForUpdate()->findOrFail($habit->id);

            if ($lockedHabit->archived_at !== null || $lockedHabit->deleted_at !== null) {
                throw ValidationException::withMessages(['habit' => 'This Habit is already permanently inactive.']);
            }

            $todayOccurrence = HabitOccurrence::query()
                ->where('habit_id', $lockedHabit->id)
                ->whereDate('occurrence_date', $calendarDate)
                ->lockForUpdate()
                ->first();

            if ($todayOccurrence !== null) {
                $this->reverseExactReward($currentSeason, $todayOccurrence->earned_sp);
                $todayOccurrence->delete();
                $this->recalculateProgression->execute($lockedHabit, $currentSeason);
            }

            $lockedHabit->inactive_on = $calendarDate;

            if ($delete) {
                $lockedHabit->save();
                $lockedHabit->delete();
            } else {
                $lockedHabit->archived_at = now();
                $lockedHabit->save();
            }
        }, 3);
    }

    private function reverseExactReward(Season $season, int $reward): void
    {
        if ($reward === 0) {
            return;
        }

        $lockedSeason = Season::query()->lockForUpdate()->findOrFail($season->id);

        if ($lockedSeason->season_points < $reward) {
            throw new RuntimeException('Season SP cannot cover the exact Habit reward being removed.');
        }

        $lockedSeason->update(['season_points' => $lockedSeason->season_points - $reward]);
    }
}
