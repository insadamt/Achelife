<?php

namespace Tests\Feature\Tasks;

use App\Actions\Tasks\CompleteTask;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BasicTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_quick_task_can_be_created_with_default_shape(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/tasks', [
            'title' => 'Finish report',
            'scheduled_date' => '2026-08-18',
            'important' => false,
            'recurrence_type' => null,
            'weekdays' => [],
            'subtasks' => [],
        ])->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'user_id' => $user->id,
            'title' => 'Finish report',
            'scheduled_date' => '2026-08-18 00:00:00',
            'important' => false,
            'task_series_id' => null,
            'completed_at' => null,
        ]);
    }

    public function test_custom_date_importance_and_subtasks_are_persisted(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/tasks', [
            'title' => 'Build portfolio',
            'scheduled_date' => '2026-08-25',
            'important' => true,
            'subtasks' => [
                ['title' => 'Header'],
                ['title' => 'Projects'],
            ],
        ])->assertRedirect();

        $task = Task::query()->firstOrFail();
        $this->assertTrue($task->important);
        $this->assertSame('2026-08-25', $task->scheduled_date->toDateString());
        $this->assertSame(['Header', 'Projects'], $task->subtasks()->pluck('title')->all());
    }

    public function test_parent_requires_every_subtask_before_completion(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 12:00:00');
        $user = User::factory()->create(['created_at' => CarbonImmutable::parse('2026-08-01')]);
        $this->actingAs($user)->post('/tasks', [
            'title' => 'Build portfolio',
            'scheduled_date' => '2026-08-18',
            'important' => true,
            'subtasks' => [['title' => 'Header'], ['title' => 'Testing']],
        ]);
        $task = Task::query()->firstOrFail();

        $this->post("/tasks/{$task->id}/completion")
            ->assertSessionHasErrors('task');

        foreach ($task->subtasks as $subtask) {
            $this->put("/tasks/{$task->id}/subtasks/{$subtask->id}", ['completed' => true])->assertRedirect();
        }

        $this->post("/tasks/{$task->id}/completion")->assertRedirect();
        $this->assertNotNull($task->refresh()->completed_at);
        $this->assertSame(8, $task->earned_sp);
    }

    public function test_completed_task_is_read_only(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 12:00:00');
        $user = User::factory()->create(['created_at' => CarbonImmutable::parse('2026-08-01')]);
        $task = $user->tasks()->create([
            'title' => 'Original title',
            'scheduled_date' => '2026-08-18',
            'important' => false,
        ]);
        app(CompleteTask::class)->execute($user, $task);

        $this->actingAs($user)->put("/tasks/{$task->id}", [
            'title' => 'Rewritten title',
            'scheduled_date' => '2026-08-19',
            'important' => true,
            'recurrence_type' => null,
            'weekdays' => [],
            'subtasks' => [],
        ])->assertSessionHasErrors('task');

        $this->assertSame('Original title', $task->refresh()->title);
        $this->assertSame('2026-08-18', $task->scheduled_date->toDateString());
    }
}
