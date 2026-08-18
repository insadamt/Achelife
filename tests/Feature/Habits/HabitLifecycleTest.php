<?php

namespace Tests\Feature\Habits;

use App\Actions\Habits\EndHabitLifecycle;
use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Habits\UpdateHabitDefinition;
use App\Actions\Habits\UpdateHabitOccurrence;
use App\Data\Habits\HabitData;
use App\Enums\HabitDifficulty;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Models\Habit;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\CreatesHabits;
use Tests\TestCase;

class HabitLifecycleTest extends TestCase
{
    use CreatesHabits, RefreshDatabase;

    public function test_all_completed_season_occurrence_states_and_values_are_locked(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $booleanHabit = $this->createHabit($user, '2026-01-27');
        $numericHabit = $this->createHabit(
            $user,
            '2026-01-27',
            type: HabitType::Numeric,
            target: '20',
            unit: 'pages',
        );
        $updates = app(UpdateHabitOccurrence::class);

        $updates->toggleBoolean($user, $booleanHabit, CarbonImmutable::parse('2026-01-27'), CarbonImmutable::parse('2026-01-27'));
        $updates->skip($user, $booleanHabit, CarbonImmutable::parse('2026-01-28'), CarbonImmutable::parse('2026-01-28'));
        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $updates->saveNumericValue($user, $numericHabit, CarbonImmutable::parse('2026-01-27'), '12', CarbonImmutable::parse('2026-01-30'));

        foreach (
            [
                fn () => $updates->toggleBoolean($user, $booleanHabit, CarbonImmutable::parse('2026-01-27'), CarbonImmutable::parse('2026-01-31')),
                fn () => $updates->clear($user, $booleanHabit, CarbonImmutable::parse('2026-01-28'), CarbonImmutable::parse('2026-01-31')),
                fn () => $updates->toggleBoolean($user, $booleanHabit, CarbonImmutable::parse('2026-01-29'), CarbonImmutable::parse('2026-01-31')),
                fn () => $updates->saveNumericValue($user, $numericHabit, CarbonImmutable::parse('2026-01-27'), '20', CarbonImmutable::parse('2026-01-31')),
            ] as $lockedChange
        ) {
            try {
                $lockedChange();
                $this->fail('Completed Season Habit history must be immutable.');
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('occurrence', $exception->errors());
            }
        }
    }

    public function test_definition_changes_start_tomorrow_while_name_and_unit_are_global(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit(
            $user,
            '2026-08-17',
            type: HabitType::Numeric,
            target: '20',
            unit: 'ml',
            name: 'Water',
        );
        $todayOccurrence = $habit->occurrences()->firstOrFail();

        app(UpdateHabitDefinition::class)->execute($habit, new HabitData(
            name: 'Hydration',
            type: HabitType::Numeric,
            unit: 'L',
            difficulty: HabitDifficulty::Hard,
            scheduleType: HabitScheduleType::SelectedWeekdays,
            weekdays: [2, 4],
            flexible: true,
            numericTarget: '3',
        ), CarbonImmutable::parse('2026-08-17'));

        $this->assertSame('Hydration', $habit->refresh()->name);
        $this->assertSame('L', $habit->unit);
        $this->assertSame('L', $todayOccurrence->habit->unit);
        $this->assertSame(4, $todayOccurrence->base_reward);
        $this->assertSame('20.000', $todayOccurrence->target_snapshot);
        $this->assertSame('every_day', $todayOccurrence->schedule_type_snapshot->value);

        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-18'));
        $tomorrowOccurrence = $habit->occurrences()->whereDate('occurrence_date', '2026-08-18')->firstOrFail();
        $this->assertSame(8, $tomorrowOccurrence->base_reward);
        $this->assertSame('3.000', $tomorrowOccurrence->target_snapshot);
        $this->assertSame('selected_weekdays', $tomorrowOccurrence->schedule_type_snapshot->value);
        $this->assertTrue($tomorrowOccurrence->flexible_snapshot);
    }

    public function test_habit_type_cannot_change_after_creation(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17');

        $this->expectException(ValidationException::class);
        app(UpdateHabitDefinition::class)->execute($habit, new HabitData(
            name: 'Changed',
            type: HabitType::Numeric,
            unit: 'pages',
            difficulty: HabitDifficulty::Normal,
            scheduleType: HabitScheduleType::EveryDay,
            weekdays: [],
            flexible: false,
            numericTarget: '20',
        ), CarbonImmutable::parse('2026-08-17'));
    }

    public function test_archive_removes_today_reverses_reward_and_preserves_earlier_history(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17');
        $updates = app(UpdateHabitOccurrence::class);
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-17'), CarbonImmutable::parse('2026-08-17'));
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-18'), CarbonImmutable::parse('2026-08-18'));

        app(EndHabitLifecycle::class)->archive($user, $habit, CarbonImmutable::parse('2026-08-18'));

        $this->assertNotNull($habit->refresh()->archived_at);
        $this->assertSame(1, $habit->current_streak);
        $this->assertSame(4, $habit->occurrences()->whereDate('occurrence_date', '2026-08-17')->value('earned_sp'));
        $this->assertSame(0, $habit->occurrences()->whereDate('occurrence_date', '2026-08-18')->count());
        $this->assertSame(4, $user->seasons()->firstOrFail()->season_points);
        $this->assertSame(1, $user->habits()->whereNotNull('archived_at')->count());
    }

    public function test_delete_soft_deletes_habit_without_exposing_it_as_archived(): void
    {
        $user = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($user, '2026-08-17');
        $updates = app(UpdateHabitOccurrence::class);
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-17'), CarbonImmutable::parse('2026-08-17'));
        $updates->toggleBoolean($user, $habit, CarbonImmutable::parse('2026-08-18'), CarbonImmutable::parse('2026-08-18'));

        app(EndHabitLifecycle::class)->delete($user, $habit, CarbonImmutable::parse('2026-08-18'));

        $deletedHabit = Habit::withTrashed()->findOrFail($habit->id);
        $this->assertNotNull($deletedHabit->deleted_at);
        $this->assertNull($deletedHabit->archived_at);
        $this->assertSame(0, $user->habits()->count());
        $this->assertSame(0, $user->habits()->whereNotNull('archived_at')->count());
        $this->assertSame(4, $deletedHabit->occurrences()->whereDate('occurrence_date', '2026-08-17')->value('earned_sp'));
        $this->assertSame(0, $deletedHabit->occurrences()->whereDate('occurrence_date', '2026-08-18')->count());
        $this->assertSame(4, $user->seasons()->firstOrFail()->season_points);
    }

    public function test_users_cannot_access_or_mutate_another_users_habit(): void
    {
        $owner = $this->userCreatedOn('2026-08-17');
        $intruder = $this->userCreatedOn('2026-08-17');
        $habit = $this->createHabit($owner, '2026-08-17');

        $payload = [
            'name' => 'Stolen',
            'type' => 'boolean',
            'difficulty' => 'normal',
            'schedule_type' => 'every_day',
        ];

        $this->actingAs($intruder)->put("/habits/{$habit->id}", $payload)->assertForbidden();
        $this->actingAs($intruder)->post("/habits/{$habit->id}/occurrences/2026-08-17/toggle")->assertForbidden();
        $this->actingAs($intruder)->post("/habits/{$habit->id}/archive")->assertForbidden();
        $this->actingAs($intruder)->delete("/habits/{$habit->id}")->assertForbidden();
        $this->assertSame('Test Habit', $habit->refresh()->name);
        $this->assertSame(HabitOccurrenceState::Pending, $habit->occurrences()->firstOrFail()->state);
    }
}
