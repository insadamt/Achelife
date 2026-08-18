<?php

namespace Tests\Feature\Habits;

use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Habits\UpdateHabitOccurrence;
use App\Enums\HabitDifficulty;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesHabits;
use Tests\TestCase;

class HabitProgressionTest extends TestCase
{
    use CreatesHabits, RefreshDatabase;

    public function test_completion_skip_miss_and_non_scheduled_days_follow_streak_semantics(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit(
            $user,
            '2026-08-17',
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [1, 3, 5],
        );
        $updates = app(UpdateHabitOccurrence::class);

        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-17'), CarbonImmutable::parse('2026-08-17'));
        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-19'));
        $updates->skip($user, $habit, CarbonImmutable::parse('2026-08-19'), CarbonImmutable::parse('2026-08-19'));
        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-21'));
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-21'), CarbonImmutable::parse('2026-08-21'));

        $occurrences = $habit->occurrences()->get()->keyBy(fn ($occurrence) => $occurrence->occurrence_date->toDateString());
        $this->assertSame(1, $occurrences['2026-08-17']->streak_after);
        $this->assertSame(1, $occurrences['2026-08-19']->streak_after);
        $this->assertSame(2, $occurrences['2026-08-21']->streak_after);
        $this->assertSame(0, $occurrences['2026-08-19']->earned_sp);
        $this->assertDatabaseMissing('habit_occurrences', ['habit_id' => $habit->id, 'occurrence_date' => '2026-08-18']);

        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-25'));
        $this->assertSame(HabitOccurrenceState::Missed, $habit->occurrences()->whereDate('occurrence_date', '2026-08-24')->firstOrFail()->state);
        $this->assertSame(0, $habit->refresh()->current_streak);
    }

    public function test_tenth_and_twentieth_completions_use_streak_multipliers(): void
    {
        $user = $this->userCreatedOn('2026-08-01');
        $habit = $this->createHabit($user, '2026-08-01');
        $updates = app(UpdateHabitOccurrence::class);

        for ($day = 1; $day <= 20; $day++) {
            $date = CarbonImmutable::parse('2026-08-01')->addDays($day - 1);
            $updates->toggleBoolean($user, $habit, $date, $date);
        }

        $tenth = $habit->occurrences()->whereDate('occurrence_date', '2026-08-10')->firstOrFail();
        $twentieth = $habit->occurrences()->whereDate('occurrence_date', '2026-08-20')->firstOrFail();
        $this->assertSame(10, $tenth->streak_after);
        $this->assertSame('1.5', $tenth->reward_multiplier);
        $this->assertSame(6, $tenth->earned_sp);
        $this->assertSame(20, $twentieth->streak_after);
        $this->assertSame('2.0', $twentieth->reward_multiplier);
        $this->assertSame(8, $twentieth->earned_sp);
        $this->assertSame(104, $user->seasons()->where('season_number', 1)->value('season_points'));
    }

    public function test_easy_and_hard_habits_receive_correct_tenth_completion_reward(): void
    {
        $user = $this->userCreatedOn('2026-08-01');
        $easy = $this->createHabit($user, '2026-08-01', difficulty: HabitDifficulty::Easy);
        $hard = $this->createHabit($user, '2026-08-01', difficulty: HabitDifficulty::Hard);
        $updates = app(UpdateHabitOccurrence::class);

        foreach ([$easy, $hard] as $habit) {
            for ($day = 1; $day <= 10; $day++) {
                $date = CarbonImmutable::parse('2026-08-01')->addDays($day - 1);
                $updates->toggleBoolean($user, $habit, $date, $date);
            }
        }

        $this->assertSame(3, $easy->occurrences()->whereDate('occurrence_date', '2026-08-10')->firstOrFail()->earned_sp);
        $this->assertSame(12, $hard->occurrences()->whereDate('occurrence_date', '2026-08-10')->firstOrFail()->earned_sp);
    }

    public function test_streak_carries_across_season_boundary(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $habit = $this->createHabit($user, '2026-01-29');
        $updates = app(UpdateHabitOccurrence::class);

        foreach (['2026-01-29', '2026-01-30', '2026-01-31'] as $date) {
            $calendarDate = CarbonImmutable::parse($date);
            $updates->toggleBoolean($user, $habit, $calendarDate, $calendarDate);
        }

        $third = $habit->occurrences()->whereDate('occurrence_date', '2026-01-31')->firstOrFail();
        $this->assertSame(2, $third->season->season_number);
        $this->assertSame(3, $third->streak_after);
        $this->assertSame(3, $habit->refresh()->current_streak);
    }

    public function test_active_season_backfill_recalculates_downstream_streak_rewards_and_only_habit_delta(): void
    {
        $user = $this->userCreatedOn('2026-08-01');
        $habit = $this->createHabit($user, '2026-08-01');
        $updates = app(UpdateHabitOccurrence::class);

        for ($day = 1; $day <= 9; $day++) {
            $date = CarbonImmutable::parse('2026-08-01')->addDays($day - 1);
            $updates->toggleBoolean($user, $habit, $date, $date);
        }

        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-11'));
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-11'), CarbonImmutable::parse('2026-08-11'));
        $season = $user->seasons()->where('season_number', 1)->firstOrFail();
        $season->increment('season_points', 16);
        $this->assertSame(56, $season->refresh()->season_points);

        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-10'), CarbonImmutable::parse('2026-08-11'));

        $dayTen = $habit->occurrences()->whereDate('occurrence_date', '2026-08-10')->firstOrFail();
        $dayEleven = $habit->occurrences()->whereDate('occurrence_date', '2026-08-11')->firstOrFail();
        $this->assertSame(10, $dayTen->streak_after);
        $this->assertSame(6, $dayTen->earned_sp);
        $this->assertSame(11, $dayEleven->streak_after);
        $this->assertSame(6, $dayEleven->earned_sp);
        $this->assertSame(64, $season->refresh()->season_points);

        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-10'), CarbonImmutable::parse('2026-08-11'));
        $this->assertSame(HabitOccurrenceState::Missed, $dayTen->refresh()->state);
        $this->assertSame(1, $dayEleven->refresh()->streak_after);
        $this->assertSame(56, $season->refresh()->season_points);
    }

    public function test_numeric_partial_value_is_preserved_and_editable_during_active_season(): void
    {
        $user = $this->userCreatedOn('2026-08-01');
        $habit = $this->createHabit($user, '2026-08-17', type: HabitType::Numeric, target: '20', unit: 'pages');
        $updates = app(UpdateHabitOccurrence::class);

        $updates->saveNumericValue($user, $habit, CarbonImmutable::parse('2026-08-17'), '12', CarbonImmutable::parse('2026-08-17'));
        $occurrence = $habit->occurrences()->firstOrFail();
        $this->assertSame(HabitOccurrenceState::Pending, $occurrence->state);
        $this->assertSame('12.000', $occurrence->numeric_value);

        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-18'));
        $this->assertSame(HabitOccurrenceState::Missed, $occurrence->refresh()->state);
        $this->assertSame('12.000', $occurrence->numeric_value);

        $updates->saveNumericValue($user, $habit, CarbonImmutable::parse('2026-08-17'), '20', CarbonImmutable::parse('2026-08-18'));
        $this->assertSame(HabitOccurrenceState::Completed, $occurrence->refresh()->state);
        $this->assertSame(4, $occurrence->earned_sp);
    }

    public function test_flexible_extra_completion_increments_but_does_not_compensate_for_required_miss(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit(
            $user,
            '2026-08-17',
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [1, 3, 5],
            flexible: true,
        );
        $updates = app(UpdateHabitOccurrence::class);

        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-17'), CarbonImmutable::parse('2026-08-17'));
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-18'), CarbonImmutable::parse('2026-08-18'));
        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-20'));
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-20'), CarbonImmutable::parse('2026-08-20'));

        $tuesday = $habit->occurrences()->whereDate('occurrence_date', '2026-08-18')->firstOrFail();
        $wednesday = $habit->occurrences()->whereDate('occurrence_date', '2026-08-19')->firstOrFail();
        $thursday = $habit->occurrences()->whereDate('occurrence_date', '2026-08-20')->firstOrFail();
        $this->assertSame('flexible_extra', $tuesday->occurrence_kind->value);
        $this->assertSame(2, $tuesday->streak_after);
        $this->assertSame(HabitOccurrenceState::Missed, $wednesday->state);
        $this->assertSame(1, $thursday->streak_after);

        $this->expectException(ValidationException::class);
        $updates->skip($user, $habit, CarbonImmutable::parse('2026-08-18'), CarbonImmutable::parse('2026-08-20'));
    }

    public function test_ignored_flexible_day_creates_no_row_or_missed_state(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit(
            $user,
            '2026-08-17',
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [1],
            flexible: true,
        );

        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-18'));

        $this->assertDatabaseMissing('habit_occurrences', ['habit_id' => $habit->id, 'occurrence_date' => '2026-08-18']);
    }

    public function test_owner_routes_complete_boolean_and_store_numeric_flexible_extra(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->userCreatedOn('2026-08-17');
        $booleanHabit = $this->createHabit($user, '2026-08-18');
        $numericHabit = $this->createHabit(
            $user,
            '2026-08-18',
            type: HabitType::Numeric,
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [5],
            flexible: true,
            target: '20',
            unit: 'pages',
        );

        $this->actingAs($user)
            ->post("/habits/{$booleanHabit->id}/occurrences/2026-08-18/toggle")
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        $this->actingAs($user)
            ->put("/habits/{$numericHabit->id}/occurrences/2026-08-18/numeric", ['value' => 20])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertSame(HabitOccurrenceState::Completed, $booleanHabit->occurrences()->firstOrFail()->state);
        $numericOccurrence = $numericHabit->occurrences()->firstOrFail();
        $this->assertSame('flexible_extra', $numericOccurrence->occurrence_kind->value);
        $this->assertSame(HabitOccurrenceState::Completed, $numericOccurrence->state);
        $this->assertSame('20.000', $numericOccurrence->numeric_value);
    }
}
