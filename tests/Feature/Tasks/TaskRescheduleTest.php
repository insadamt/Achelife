<?php

namespace Tests\Feature\Tasks;

use App\Actions\Tasks\UpdateTask;
use App\Data\Tasks\TaskData;
use App\Models\User;
use App\Services\Tasks\TaskRewardCalculator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskRescheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_overdue_task_can_move_to_future_and_preserves_scheduling_history(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $task = $user->tasks()->create([
            'title' => 'Reschedule me',
            'scheduled_date' => '2026-08-15',
            'important' => true,
        ]);
        $calculator = app(TaskRewardCalculator::class);
        $oldProjection = $calculator->calculate(true, $task->scheduled_date, CarbonImmutable::today());

        $updatedTask = app(UpdateTask::class)->execute($task, new TaskData(
            title: $task->title,
            scheduledDate: CarbonImmutable::parse('2026-08-20'),
            important: true,
            recurrenceType: null,
            weekdays: [],
            subtasks: [],
        ));
        $newProjection = $calculator->calculate(true, $updatedTask->scheduled_date, CarbonImmutable::today());

        $this->assertSame(4, $oldProjection->points);
        $this->assertSame(16, $newProjection->points);
        $this->assertTrue($updatedTask->scheduled_date->isAfter(CarbonImmutable::today()));
        $this->assertDatabaseHas('task_reschedules', [
            'task_id' => $task->id,
            'from_date' => '2026-08-15 00:00:00',
            'to_date' => '2026-08-20 00:00:00',
        ]);
    }
}
