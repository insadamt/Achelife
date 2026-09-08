<?php

namespace Tests\Feature\Habits;

use App\Actions\Habits\EndHabitLifecycle;
use App\Actions\Habits\UpdateHabitOccurrence;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesHabits;
use Tests\TestCase;

class HabitStatisticsTest extends TestCase
{
    use CreatesHabits, RefreshDatabase;

    public function test_required_outcomes_exclude_pending_and_extras_from_adherence(): void
    {
        CarbonImmutable::setTestNow('2026-08-21 12:00:00');
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17', schedule: HabitScheduleType::SelectedWeekdays, weekdays: [1, 3, 4, 5], flexible: true);
        $updates = app(UpdateHabitOccurrence::class);
        foreach (['2026-08-17', '2026-08-18'] as $day) {
            $date = CarbonImmutable::parse($day);
            $updates->toggleBoolean($user, $habit, $date, $date);
        }
        $date = CarbonImmutable::parse('2026-08-19');
        $updates->skip($user, $habit, $date, $date);

        $this->introduceSeason($user);
        $this->actingAs($user)->get("/habits/{$habit->id}/statistics")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('habits/Statistics')
            ->where('statistics.current.completionRate', 50)
            ->where('statistics.current.completed', 2)
            ->where('statistics.current.requiredCompleted', 1)
            ->where('statistics.current.extras', 1)
            ->where('statistics.current.skipped', 1)
            ->where('statistics.current.missed', 1)
            ->where('statistics.current.bestStreak', 2)
            ->where('statistics.currentStreak', 0)
            ->where('statistics.previous', null)
            ->has('statistics.days', 5)
            ->where('statistics.days.4.state', 'pending'));
    }

    public function test_numeric_totals_include_partial_and_zero_values_and_keep_target_snapshots(): void
    {
        CarbonImmutable::setTestNow('2026-08-20 12:00:00');
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17', type: HabitType::Numeric, target: '20', unit: 'pages');
        $updates = app(UpdateHabitOccurrence::class);
        foreach (['2026-08-17' => '20', '2026-08-18' => '10', '2026-08-19' => '0'] as $day => $value) {
            $date = CarbonImmutable::parse($day);
            $updates->saveNumericValue($user, $habit, $date, $value, $date);
        }
        $this->introduceSeason($user);
        $this->actingAs($user)->get("/habits/{$habit->id}/statistics?statistics_period=month")
            ->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('statistics.current.total', 30)
            ->where('statistics.current.average', 10)
            ->where('statistics.current.recordedDays', 3)
            ->where('statistics.current.completed', 1)
            ->where('statistics.current.missed', 2)
            ->where('statistics.days.1.value', 10)
            ->where('statistics.days.1.target', 20)
            ->where('statistics.days.1.state', 'missed')
            ->where('statistics.trend.buckets.17.total', 10)
            ->where('statistics.trend.buckets.18.average', 0)
            ->where('statistics.trend.buckets.19.average', null)
            ->where('statistics.previous.total', 0));
    }

    public function test_month_comparison_uses_full_previous_month_and_streak_is_period_scoped(): void
    {
        CarbonImmutable::setTestNow('2026-09-02 12:00:00');
        $user = $this->userCreatedOn('2026-08-29');
        $habit = $this->createHabit($user, '2026-08-29');
        foreach (['2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'] as $day) {
            $date = CarbonImmutable::parse($day);
            app(UpdateHabitOccurrence::class)->toggleBoolean($user, $habit, $date, $date);
        }
        $this->introduceSeason($user);
        $this->actingAs($user)->get("/habits/{$habit->id}/statistics?statistics_period=month")
            ->assertInertia(fn (Assert $page) => $page
                ->where('statistics.current.completed', 2)
                ->where('statistics.previous.completed', 3)
                ->where('statistics.current.bestStreak', 2)
                ->where('statistics.previous.bestStreak', 3)
                ->where('statistics.currentStreak', 5)
                ->where('statistics.selector.previousValue', '2026-08')
                ->where('statistics.selector.nextValue', null)
                ->has('statistics.trend.buckets', 2));
        $this->get("/habits/{$habit->id}/statistics?statistics_period=month&statistics_value=2026-08")
            ->assertInertia(fn (Assert $page) => $page
                ->where('statistics.current.completed', 3)
                ->where('statistics.selector.nextValue', '2026-09')
                ->has('statistics.trend.buckets', 31));
        $this->get("/habits/{$habit->id}/statistics?statistics_period=year")
            ->assertInertia(fn (Assert $page) => $page->where('statistics.current.completed', 5)->where('statistics.trend.unit', 'month')->has('statistics.trend.buckets', 9));
        $this->get("/habits/{$habit->id}/statistics?statistics_period=all")
            ->assertInertia(fn (Assert $page) => $page->where('statistics.current.completed', 5)->where('statistics.previous', null)->where('statistics.comparisonLabel', null));
    }

    public function test_statistics_are_private_and_archived_history_remains_accessible(): void
    {
        CarbonImmutable::setTestNow('2026-08-19 12:00:00');
        $owner = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($owner, '2026-08-17');
        $other = $this->userCreatedOn('2026-08-17');
        $this->introduceSeason($other);
        $this->actingAs($other)->get("/habits/{$habit->id}/statistics")->assertForbidden();
        app(EndHabitLifecycle::class)->archive($owner, $habit);
        $this->introduceSeason($owner);
        $this->actingAs($owner)->get("/habits/{$habit->id}/statistics")->assertOk()->assertInertia(fn (Assert $page) => $page->where('habit.archived', true));
        $habit->delete();
        $this->get("/habits/{$habit->id}/statistics")->assertNotFound();
    }

    public function test_empty_periods_and_invalid_calendar_selections_are_safe(): void
    {
        CarbonImmutable::setTestNow('2026-08-17 12:00:00');
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17');
        $this->introduceSeason($user);
        $this->actingAs($user)->get("/habits/{$habit->id}/statistics?statistics_period=month&statistics_value=2026-07")
            ->assertInertia(fn (Assert $page) => $page->where('statistics.current.completionRate', null)->where('statistics.current.completed', 0)->has('statistics.days', 0));
        foreach (['2026-99', '1', '9999-12'] as $selection) {
            $this->get("/habits/{$habit->id}/statistics?statistics_period=month&statistics_value={$selection}")
                ->assertInertia(fn (Assert $page) => $page->where('statistics.label', 'August 2026'));
        }
    }

    public function test_unresolved_numeric_extras_contribute_values_without_becoming_misses(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 12:00:00');
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17', type: HabitType::Numeric, schedule: HabitScheduleType::SelectedWeekdays, weekdays: [1], flexible: true, target: '20', unit: 'pages');
        $date = CarbonImmutable::parse('2026-08-18');
        app(UpdateHabitOccurrence::class)->saveNumericValue($user, $habit, $date, '5', $date);
        $this->introduceSeason($user);
        $this->actingAs($user)->get("/habits/{$habit->id}/statistics")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('statistics.current.total', 5)
            ->where('statistics.current.missed', 1)
            ->where('statistics.current.extras', 0)
            ->where('statistics.days.1.state', null)
            ->where('statistics.days.1.value', 5));
    }

    private function introduceSeason(User $user): void
    {
        app(ResolveUserSeasonCycle::class)->execute($user)->activeSeason?->update(['introduced_at' => now()]);
    }
}
