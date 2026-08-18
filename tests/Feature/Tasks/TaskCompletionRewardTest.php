<?php

namespace Tests\Feature\Tasks;

use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\DeleteTaskOccurrence;
use App\Actions\Tasks\MarkTaskIncomplete;
use App\Actions\Tasks\UpdateTask;
use App\Data\Tasks\TaskData;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TaskCompletionRewardTest extends TestCase
{
    use RefreshDatabase;

    public function test_task_scheduled_in_first_season_and_completed_in_second_rewards_second_season(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $task = $user->tasks()->create([
            'title' => 'Global Task',
            'scheduled_date' => '2026-01-15',
            'important' => true,
        ]);

        app(CompleteTask::class)->execute($user, $task, CarbonImmutable::parse('2026-02-01 14:30:00'));

        $task->refresh();
        $this->assertSame(4, $task->earned_sp);
        $this->assertSame('late', $task->completion_timing->value);
        $this->assertSame(2, $task->rewardSeason->season_number);
        $this->assertSame(0, $user->seasons()->where('season_number', 1)->value('season_points'));
        $this->assertSame(4, $user->seasons()->where('season_number', 2)->value('season_points'));
    }

    public function test_active_season_completion_can_be_reverted_and_exact_sp_is_removed(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $task = $user->tasks()->create([
            'title' => 'Reversible Task',
            'scheduled_date' => '2026-02-04',
            'important' => true,
        ]);
        app(CompleteTask::class)->execute($user, $task, CarbonImmutable::parse('2026-02-01 10:00:00'));
        $rewardSeasonId = $task->refresh()->reward_season_id;

        app(MarkTaskIncomplete::class)->execute($user, $task, CarbonImmutable::parse('2026-02-02'));

        $task->refresh();
        $this->assertNull($task->completed_at);
        $this->assertNull($task->earned_sp);
        $this->assertNull($task->reward_season_id);
        $this->assertSame(0, $user->seasons()->findOrFail($rewardSeasonId)->season_points);

        app(CompleteTask::class)->execute($user, $task, CarbonImmutable::parse('2026-02-04 11:00:00'));
        $this->assertSame(8, $task->refresh()->earned_sp);
        $this->assertSame(8, $user->seasons()->findOrFail($rewardSeasonId)->season_points);
    }

    public function test_finished_season_completion_cannot_be_reverted_or_deleted(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $task = $user->tasks()->create([
            'title' => 'Historical Task',
            'scheduled_date' => '2026-01-15',
            'important' => false,
        ]);
        app(CompleteTask::class)->execute($user, $task, CarbonImmutable::parse('2026-01-15 09:00:00'));

        try {
            app(MarkTaskIncomplete::class)->execute($user, $task, CarbonImmutable::parse('2026-02-01'));
            $this->fail('The historical completion should be locked.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('task', $exception->errors());
        }

        $this->expectException(ValidationException::class);
        app(DeleteTaskOccurrence::class)->execute($task);
    }

    public function test_incomplete_task_survives_season_transition_and_remains_editable(): void
    {
        $user = $this->userCreatedOn('2026-01-01');
        $task = $user->tasks()->create([
            'title' => 'Old incomplete Task',
            'scheduled_date' => '2026-01-15',
            'important' => true,
        ]);

        $updatedTask = app(UpdateTask::class)->execute($task, new TaskData(
            title: 'Still editable',
            scheduledDate: CarbonImmutable::parse('2026-02-10'),
            important: true,
            recurrenceType: null,
            weekdays: [],
            subtasks: [],
        ));

        $this->assertSame('Still editable', $updatedTask->title);
        $this->assertSame('2026-02-10', $updatedTask->scheduled_date->toDateString());
        $this->assertDatabaseCount('tasks', 1);
    }

    private function userCreatedOn(string $date): User
    {
        return User::factory()->create([
            'created_at' => CarbonImmutable::parse($date),
            'updated_at' => CarbonImmutable::parse($date),
        ]);
    }
}
