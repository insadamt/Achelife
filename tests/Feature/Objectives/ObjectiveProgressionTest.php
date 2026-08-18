<?php

namespace Tests\Feature\Objectives;

use App\Actions\Constitution\CreateLaw;
use App\Actions\Constitution\RecordViolation;
use App\Actions\Diary\AutosaveDiaryEntry;
use App\Actions\Habits\CreateHabit;
use App\Actions\Habits\UpdateHabitOccurrence;
use App\Actions\Tasks\CompleteTask;
use App\Data\Habits\HabitData;
use App\Enums\HabitDifficulty;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Enums\LawSeverity;
use App\Models\DiarySetting;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesObjectives;
use Tests\TestCase;

class ObjectiveProgressionTest extends TestCase
{
    use CreatesObjectives, RefreshDatabase;

    public function test_completion_and_reversal_use_exact_rewards_after_setup_while_preserving_negative_sp(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();
        $first = $this->createObjective($user, $season, 'First');
        $this->createObjective($user, $season, 'Second');
        $season->update(['season_points' => -200]);
        CarbonImmutable::setTestNow('2026-08-08 10:00:00');

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives/{$first->id}/toggle")
            ->assertRedirect();

        $this->assertSame(-50, $season->refresh()->season_points);
        $this->assertSame(150, $first->refresh()->earned_sp);
        $this->assertNotNull($first->completed_at);

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives/{$first->id}/toggle")
            ->assertRedirect();

        $this->assertSame(-200, $season->refresh()->season_points);
        $this->assertNull($first->refresh()->earned_sp);
        $this->assertNull($first->completed_at);
    }

    public function test_rewards_rebalance_transactionally_across_one_two_and_three_objectives(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();
        $season->update(['season_points' => 40]);
        $first = $this->createObjective($user, $season, 'First');
        $this->toggleObjective($first, '2026-08-02');
        $this->assertSame(340, $season->refresh()->season_points);

        $second = $this->createObjective($user, $season, 'Second', '2026-08-02');
        $this->assertSame(150, $first->refresh()->earned_sp);
        $this->assertSame(190, $season->refresh()->season_points);

        $this->toggleObjective($second, '2026-08-02');
        $this->assertSame(340, $season->refresh()->season_points);
        $third = $this->createObjective($user, $season, 'Third', '2026-08-03');

        $this->assertSame(100, $first->refresh()->earned_sp);
        $this->assertSame(100, $second->refresh()->earned_sp);
        $this->assertSame(240, $season->refresh()->season_points);

        CarbonImmutable::setTestNow('2026-08-03 10:00:00');
        $this->actingAs($user)
            ->delete("/seasons/{$season->id}/objectives/{$third->id}")
            ->assertRedirect();

        $this->assertSame(150, $first->refresh()->earned_sp);
        $this->assertSame(150, $second->refresh()->earned_sp);
        $this->assertSame(340, $season->refresh()->season_points);
    }

    public function test_deleting_incomplete_and_completed_objectives_removes_stale_sp_and_rebalances_remaining_rewards(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();
        $season->update(['season_points' => 25]);
        $completed = $this->createObjective($user, $season, 'Completed');
        $incomplete = $this->createObjective($user, $season, 'Incomplete');
        $this->toggleObjective($completed, '2026-08-02');
        $this->assertSame(175, $season->refresh()->season_points);

        CarbonImmutable::setTestNow('2026-08-02 10:00:00');
        $this->actingAs($user)
            ->delete("/seasons/{$season->id}/objectives/{$incomplete->id}")
            ->assertRedirect();

        $this->assertSame(300, $completed->refresh()->earned_sp);
        $this->assertSame(325, $season->refresh()->season_points);

        $replacement = $this->createObjective($user, $season, 'Replacement', '2026-08-02');
        $this->assertSame(150, $completed->refresh()->earned_sp);
        $this->actingAs($user)
            ->delete("/seasons/{$season->id}/objectives/{$completed->id}")
            ->assertRedirect();

        $this->assertSoftDeleted('objectives', ['id' => $completed->id]);
        $this->assertNull($replacement->refresh()->earned_sp);
        $this->assertSame(25, $season->refresh()->season_points);
    }

    public function test_completion_is_permanently_locked_after_the_season_ends(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();
        $objective = $this->createObjective($user, $season);
        CarbonImmutable::setTestNow('2026-08-31 10:00:00');

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives/{$objective->id}/toggle")
            ->assertSessionHasErrors('objective');

        $this->assertNull($objective->refresh()->completed_at);
        $this->assertSame(0, $season->refresh()->season_points);
    }

    public function test_rebalancing_changes_only_objective_contribution_among_all_shared_sp_sources(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();
        $date = CarbonImmutable::parse('2026-08-01');
        $task = $user->tasks()->create([
            'title' => 'Task contribution',
            'scheduled_date' => $date,
            'important' => false,
        ]);
        app(CompleteTask::class)->execute($user, $task, $date->setTime(10, 0));

        $habit = app(CreateHabit::class)->execute($user, new HabitData(
            name: 'Habit contribution',
            type: HabitType::Boolean,
            unit: null,
            difficulty: HabitDifficulty::Normal,
            scheduleType: HabitScheduleType::EveryDay,
            weekdays: [],
            flexible: false,
            numericTarget: null,
        ), $date);
        app(UpdateHabitOccurrence::class)->toggleBoolean($user, $habit, $date, $date);

        DiarySetting::query()->create(['user_id' => $user->id, 'languages' => ['en']]);
        $diaryEntry = app(AutosaveDiaryEntry::class)->execute($user, $date, [
            'content' => [['type' => 'text', 'text' => 'Today was a very good day.']],
            'language_code' => 'en',
            'mood' => 'peaceful',
            'mood_group' => 'calm',
            'client_revision' => 1,
        ], $date);

        $law = app(CreateLaw::class)->execute($user, 'Constitution contribution', LawSeverity::Minor);
        $violation = app(RecordViolation::class)->execute($user, $law, $date, $date);
        $this->assertSame(2, $season->refresh()->season_points);

        $firstObjective = $this->createObjective($user, $season, 'First', '2026-08-01');
        $this->toggleObjective($firstObjective, '2026-08-01');
        $this->assertSame(302, $season->refresh()->season_points);

        $this->createObjective($user, $season, 'Second', '2026-08-01');
        $this->assertSame(152, $season->refresh()->season_points);
        $this->assertSame(4, $task->refresh()->earned_sp);
        $this->assertSame(4, $habit->occurrences()->firstOrFail()->earned_sp);
        $this->assertSame(4, $diaryEntry->refresh()->earned_sp);
        $this->assertSame(-10, $violation->refresh()->penalty_sp);
    }
}
