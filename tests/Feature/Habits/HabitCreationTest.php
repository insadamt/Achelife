<?php

namespace Tests\Feature\Habits;

use App\Enums\HabitDifficulty;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
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
        $this->assertSame('2026-08-18', $habit->starts_on->toDateString());
        $this->assertCount(1, $habit->occurrences);
        $this->assertSame(HabitOccurrenceState::Pending, $habit->occurrences->first()->state);
        $this->assertSame(4, $habit->occurrences->first()->base_reward);
        $this->assertDatabaseMissing('habit_occurrences', ['occurrence_date' => '2026-08-19']);
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
            ->where('currentWeek.startDate', '2026-08-17')
            ->where('currentWeek.endDate', '2026-08-23')
            ->has('habits.0.days', 30)
            ->where('habits.0.days.0.date', '2026-08-01')
            ->where('habits.0.days.29.date', '2026-08-30'));

        $this->actingAs($user)->put('/habits/settings/calendar-labels', ['calendar_labels' => 'season_days'])
            ->assertSessionHasNoErrors()
            ->assertRedirect();
        $this->assertDatabaseHas('habit_settings', ['user_id' => $user->id, 'calendar_labels' => 'season_days']);
        $this->assertSame(0, $season->refresh()->season_points);
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
