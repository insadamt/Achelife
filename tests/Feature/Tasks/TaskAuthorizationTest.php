<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_view_or_mutate_another_users_tasks(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = $owner->tasks()->create([
            'title' => 'Private Task',
            'scheduled_date' => '2026-08-18',
            'important' => false,
        ]);
        $subtask = $task->subtasks()->create(['title' => 'Private subtask', 'position' => 0]);

        app(SynchronizeUserSeasons::class)->execute($intruder)->update(['introduced_at' => now()]);
        $this->actingAs($intruder)
            ->get('/tasks')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('tasks/Index')
                ->has('todayTasks', 0)
                ->has('upcomingTasks', 0)
                ->has('overdueTasks.data', 0)
                ->has('completedTasks.data', 0));

        $this->post("/tasks/{$task->id}/completion")->assertForbidden();
        $this->put("/tasks/{$task->id}", $this->updatePayload())->assertForbidden();
        $this->put("/tasks/{$task->id}/subtasks/{$subtask->id}", ['completed' => true])->assertForbidden();
        $this->delete("/tasks/{$task->id}")->assertForbidden();

        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'completed_at' => null]);
        $this->assertDatabaseHas('subtasks', ['id' => $subtask->id, 'completed_at' => null]);
    }

    /** @return array<string, mixed> */
    private function updatePayload(): array
    {
        return [
            'title' => 'Hijacked',
            'scheduled_date' => '2026-08-20',
            'important' => true,
            'recurrence_type' => null,
            'weekdays' => [],
            'subtasks' => [],
        ];
    }
}
