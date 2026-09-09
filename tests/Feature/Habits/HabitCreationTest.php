<?php

namespace Tests\Feature\Habits;

use App\Actions\Habits\UpdateHabitOccurrence;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Enums\HabitDifficulty;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Support\Habits\HabitViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesHabits;
use Tests\TestCase;

class HabitCreationTest extends TestCase
{
    use CreatesHabits, RefreshDatabase;

    public function test_boolean_habit_materializes_only_todays_required_occurrence(): void
    {
        $user = $this->userCreatedOn('2026-08-01');
        $habit = $this->createHabit($user, '2026-08-18', name: 'Workout');

        $this->assertSame(HabitType::Boolean, $habit->type);
        $this->assertSame('check', $habit->icon->value);
        $this->assertSame('2026-08-18', $habit->starts_on->toDateString());
        $this->assertCount(1, $habit->occurrences);
        $this->assertSame(HabitOccurrenceState::Pending, $habit->occurrences->first()->state);
        $this->assertSame(4, $habit->occurrences->first()->base_reward);
        $this->assertDatabaseMissing('habit_occurrences', ['occurrence_date' => '2026-08-19']);
    }

    public function test_habits_store_a_selected_icon_and_expose_it_in_the_page_payload(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->userCreatedOn('2026-08-18');

        $this->actingAs($user)->post('/habits', [
            'name' => 'Lift weights',
            'icon' => 'dumbbell',
            'type' => 'boolean',
            'difficulty' => 'normal',
            'schedule_type' => 'every_day',
        ])->assertRedirect();

        $this->assertDatabaseHas('habits', ['user_id' => $user->id, 'name' => 'Lift weights', 'icon' => 'dumbbell']);
        $user->seasons()->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/habits')->assertInertia(fn (Assert $page) => $page
            ->where('habits.0.icon', 'dumbbell'));
    }

    public function test_habits_accept_the_islam_icon(): void
    {
        $user = $this->userCreatedOn('2026-08-18');

        $this->actingAs($user)->post('/habits', [
            'name' => 'Read Quran',
            'icon' => 'islam',
            'type' => 'boolean',
            'difficulty' => 'normal',
            'schedule_type' => 'every_day',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('habits', ['user_id' => $user->id, 'name' => 'Read Quran', 'icon' => 'islam']);
    }

    public function test_habit_icons_must_come_from_the_supported_set(): void
    {
        $user = $this->userCreatedOn('2026-08-18');

        $this->actingAs($user)->post('/habits', [
            'name' => 'Invalid icon',
            'icon' => 'untrusted-icon',
            'type' => 'boolean',
            'difficulty' => 'normal',
            'schedule_type' => 'every_day',
        ])->assertSessionHasErrors('icon');
    }

    public function test_missing_legacy_icon_uses_the_default_in_habit_page_data(): void
    {
        $user = $this->userCreatedOn('2026-08-18');
        $habit = $this->createHabit($user, '2026-08-18');
        $season = $user->seasons()->firstOrFail();
        $habit->setAttribute('icon', null);

        $data = app(HabitViewDataFactory::class)->make(
            $habit,
            $season,
            CarbonImmutable::parse('2026-08-18'),
            collect([$season]),
        );

        $this->assertSame('check', $data['icon']);
    }

    public function test_numeric_habit_preserves_target_and_uses_global_unit(): void
    {
        $user = $this->userCreatedOn('2026-08-01');
        $habit = $this->createHabit(
            $user,
            '2026-08-18',
            type: HabitType::Numeric,
            target: '20',
            unit: 'pages',
            name: 'Reading',
        );

        $this->assertSame('pages', $habit->unit);
        $this->assertSame('20.000', $habit->definitionVersions->first()->numeric_target);
        $this->assertSame('20.000', $habit->occurrences->first()->target_snapshot);
    }

    public function test_all_difficulties_snapshot_the_automatic_base_reward(): void
    {
        $user = $this->userCreatedOn('2026-08-18');

        foreach ([[HabitDifficulty::Easy, 2], [HabitDifficulty::Normal, 4], [HabitDifficulty::Hard, 8]] as [$difficulty, $reward]) {
            $habit = $this->createHabit($user, '2026-08-18', difficulty: $difficulty);
            $this->assertSame($reward, $habit->occurrences->first()->base_reward);
        }
    }

    public function test_selected_weekdays_and_flexible_mode_are_stored_without_non_selected_rows(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit(
            $user,
            '2026-08-17',
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [1, 3, 5],
            flexible: true,
        );

        $definition = $habit->definitionVersions->first();
        $this->assertSame([1, 3, 5], $definition->weekdays);
        $this->assertTrue($definition->flexible);
        $this->assertSame(1, $habit->occurrences()->whereDate('occurrence_date', '2026-08-17')->count());
        $this->assertSame(0, $habit->occurrences()->whereDate('occurrence_date', '2026-08-18')->count());
    }

    public function test_selected_weekdays_require_at_least_one_day_and_flexible_is_not_available_for_every_day(): void
    {
        $user = $this->userCreatedOn('2026-08-18');

        $this->actingAs($user)->post('/habits', [
            'name' => 'Invalid',
            'type' => 'boolean',
            'difficulty' => 'normal',
            'schedule_type' => 'selected_weekdays',
            'weekdays' => [],
            'flexible' => true,
        ])->assertSessionHasErrors('weekdays');

        $this->actingAs($user)->post('/habits', [
            'name' => 'Daily',
            'type' => 'boolean',
            'difficulty' => 'normal',
            'schedule_type' => 'every_day',
            'flexible' => true,
        ])->assertRedirect();

        $this->assertFalse($user->habits()->latest('id')->firstOrFail()->definitionVersions()->firstOrFail()->flexible);
    }

    public function test_calendar_payload_contains_only_current_season_and_supports_both_label_modes(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->userCreatedOn('2026-08-01');
        $season = $user->seasons()->create([
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
            'introduced_at' => now(),
        ]);
        $this->createHabit($user, '2026-08-18');

        $this->actingAs($user)->get('/habits')->assertInertia(fn (Assert $page) => $page
            ->component('habits/Index')
            ->where('calendarLabels', 'calendar_dates')
            ->has('habits.0.recentDays', 7)
            ->where('habits.0.recentDays.0.date', '2026-08-12')
            ->where('habits.0.recentDays.6.date', '2026-08-18')
            ->where('habits.0.recentDays.6.today', true)
            ->has('habits.0.days', 30)
            ->where('habits.0.days.0.date', '2026-08-01')
            ->where('habits.0.days.29.date', '2026-08-30'));

        $this->actingAs($user)->put('/habits/settings/calendar-labels', ['calendar_labels' => 'season_days'])
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        $this->assertDatabaseHas('habit_settings', ['user_id' => $user->id, 'calendar_labels' => 'season_days']);
        $this->assertSame(0, $season->refresh()->season_points);
    }

    public function test_recent_days_cross_season_boundaries_and_end_on_the_users_local_today(): void
    {
        CarbonImmutable::setTestNow('2026-08-30 16:00:00 UTC');
        $user = $this->userCreatedOn('2026-08-01');
        $user->update(['timezone' => 'Asia/Tokyo']);
        $habit = $this->createHabit($user, '2026-08-28');
        $date = CarbonImmutable::parse('2026-08-30');
        app(UpdateHabitOccurrence::class)->toggleBoolean($user, $habit, $date, $date);
        app(ResolveUserSeasonCycle::class)->execute($user)->activeSeason->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/habits')->assertInertia(fn (Assert $page) => $page
            ->where('today', '2026-08-31')
            ->has('habits.0.recentDays', 7)
            ->where('habits.0.recentDays.0.date', '2026-08-25')
            ->where('habits.0.recentDays.0.clickable', false)
            ->where('habits.0.recentDays.5.date', '2026-08-30')
            ->where('habits.0.recentDays.5.state', 'completed')
            ->where('habits.0.recentDays.5.seasonDay', 30)
            ->where('habits.0.recentDays.5.clickable', false)
            ->where('habits.0.recentDays.6.date', '2026-08-31')
            ->where('habits.0.recentDays.6.weekday', 1)
            ->where('habits.0.recentDays.6.today', true)
            ->where('habits.0.recentDays.6.clickable', true)
            ->has('habits.0.days', 30)
            ->where('habits.0.days.0.date', '2026-08-31'));
    }

    public function test_recent_days_include_inactive_intermission_dates_without_scheduled_states(): void
    {
        CarbonImmutable::setTestNow('2026-09-02 12:00:00');
        $user = $this->userCreatedOn('2026-08-01');
        $user->update(['season_rollover_preference' => 'manual']);
        $this->createHabit($user, '2026-08-28');
        $user->seasons()->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/habits')->assertInertia(fn (Assert $page) => $page
            ->where('intermission', true)
            ->has('habits.0.recentDays', 7)
            ->where('habits.0.recentDays.0.date', '2026-08-27')
            ->where('habits.0.recentDays.6.date', '2026-09-02')
            ->where('habits.0.recentDays.6.today', true)
            ->where('habits.0.recentDays.6.state', null)
            ->where('habits.0.recentDays.6.required', false)
            ->where('habits.0.recentDays.6.clickable', false)
            ->where('habits.0.days.29.date', '2026-08-30'));
    }

    public function test_inertia_navigation_updates_the_redirect_destination_for_habit_actions(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = $this->userCreatedOn('2026-08-18');
        $habit = $this->createHabit($user, '2026-08-18');
        $user->seasons()->update(['introduced_at' => now()]);

        $seasonsResponse = $this->actingAs($user)->get('/seasons')->assertOk();
        $inertiaHeaders = ['X-Inertia' => 'true'];
        $assetVersion = $seasonsResponse->inertiaPage()['version'];

        if (is_string($assetVersion)) {
            $inertiaHeaders['X-Inertia-Version'] = $assetVersion;
        }

        $this->get('/habits', $inertiaHeaders)->assertOk();

        $this->post("/habits/{$habit->id}/occurrences/2026-08-18/toggle")
            ->assertRedirect('/habits');
    }
}
