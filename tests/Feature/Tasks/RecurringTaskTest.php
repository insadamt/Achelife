<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\CreateTask;
use App\Actions\Tasks\DeleteTaskOccurrence;
use App\Actions\Tasks\SetSubtaskCompletion;
use App\Actions\Tasks\StopTaskSeriesFromOccurrence;
use App\Actions\Tasks\SynchronizeRecurringTaskOccurrences;
use App\Actions\Tasks\UpdateTask;
use App\Data\Tasks\SubtaskData;
use App\Data\Tasks\TaskData;
use App\Enums\TaskRecurrenceType;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RecurringTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_recurrence_keeps_only_one_pending_occurrence_and_advances_when_it_becomes_overdue(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $firstTask = $this->createRecurringTask($user, TaskRecurrenceType::Daily);
        $series = $firstTask->series;

        $this->assertSame('2026-08-17', $firstTask->occurrence_date->toDateString());
        $this->assertSame([
            '2026-08-17',
            '2026-08-18',
        ], $this->occurrenceDates($series->tasks()->get()));

        app(SynchronizeRecurringTaskOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-18'));
        $this->assertSame(2, $series->tasks()->count());

        app(SynchronizeRecurringTaskOccurrences::class)->execute($user, CarbonImmutable::parse('2026-08-19'));
        $this->assertSame([
            '2026-08-17',
            '2026-08-18',
            '2026-08-19',
        ], $this->occurrenceDates($series->tasks()->get()));
    }

    public function test_selected_weekday_recurrence_uses_only_selected_days(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $task = $this->createRecurringTask($user, TaskRecurrenceType::Weekdays, [1, 3, 5]);

        $this->assertSame([
            '2026-08-17',
            '2026-08-19',
        ], $this->occurrenceDates($task->series->tasks()->get()));
    }

    public function test_missed_occurrence_does_not_block_a_later_occurrence(): void
    {
        CarbonImmutable::setTestNow('2026-08-19 12:00:00');
        $user = User::factory()->create(['created_at' => CarbonImmutable::parse('2026-08-01')]);
        $firstTask = $this->createRecurringTask($user, TaskRecurrenceType::Weekdays, [1, 3, 5]);
        $wednesdayTask = $firstTask->series->tasks()->whereDate('occurrence_date', '2026-08-19')->firstOrFail();

        app(CompleteTask::class)->execute($user, $wednesdayTask, CarbonImmutable::now());

        $this->assertNull($firstTask->refresh()->completed_at);
        $this->assertNotNull($wednesdayTask->refresh()->completed_at);
        $this->assertSame([
            '2026-08-17',
            '2026-08-19',
            '2026-08-21',
        ], $this->occurrenceDates($firstTask->series->tasks()->get()));
    }

    public function test_each_occurrence_has_a_fresh_subtask_snapshot(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $firstTask = $this->createRecurringTask($user, TaskRecurrenceType::Daily, [1], ['Prepare', 'Review']);
        $secondTask = $firstTask->series->tasks()->whereDate('occurrence_date', '2026-08-18')->firstOrFail();

        app(SetSubtaskCompletion::class)->execute($firstTask, $firstTask->subtasks->first(), true);

        $this->assertNotNull($firstTask->subtasks()->first()->completed_at);
        $this->assertSame(2, $secondTask->subtasks()->count());
        $this->assertSame(0, $secondTask->subtasks()->whereNotNull('completed_at')->count());
    }

    public function test_template_edit_changes_selected_and_future_occurrences_without_rewriting_history(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $mondayTask = $this->createRecurringTask($user, TaskRecurrenceType::Daily, [1], ['Old checklist']);
        $tuesdayTask = $mondayTask->series->tasks()->whereDate('occurrence_date', '2026-08-18')->firstOrFail();

        app(UpdateTask::class)->execute($tuesdayTask, new TaskData(
            title: 'Updated routine',
            scheduledDate: $tuesdayTask->scheduled_date,
            important: true,
            recurrenceType: TaskRecurrenceType::Daily,
            weekdays: [],
            subtasks: [new SubtaskData(null, 'New checklist')],
        ));

        $this->assertFalse($mondayTask->series->tasks()->whereDate('occurrence_date', '2026-08-19')->exists());

        app(SetSubtaskCompletion::class)->execute(
            $tuesdayTask->refresh(),
            $tuesdayTask->subtasks()->firstOrFail(),
            true,
        );
        app(CompleteTask::class)->execute($user, $tuesdayTask->refresh(), CarbonImmutable::now());

        $wednesdayTask = $mondayTask->series->tasks()->whereDate('occurrence_date', '2026-08-19')->firstOrFail();
        $this->assertSame('Recurring Task', $mondayTask->refresh()->title);
        $this->assertSame('Old checklist', $mondayTask->subtasks()->first()->title);
        $this->assertSame(TaskRecurrenceType::Daily, $mondayTask->recurrence_type_snapshot);
        $this->assertSame('Updated routine', $tuesdayTask->refresh()->title);
        $this->assertSame('Updated routine', $wednesdayTask->title);
        $this->assertSame('New checklist', $wednesdayTask->subtasks()->first()->title);
    }

    public function test_deleting_one_occurrence_preserves_future_recurrence(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $firstTask = $this->createRecurringTask($user, TaskRecurrenceType::Daily);
        $series = $firstTask->series;
        $deletedTask = $series->tasks()->whereDate('occurrence_date', '2026-08-18')->firstOrFail();

        app(DeleteTaskOccurrence::class)->execute($deletedTask);
        app(SynchronizeRecurringTaskOccurrences::class)->synchronizeSeries($series->refresh(), CarbonImmutable::parse('2026-08-18'));

        $this->assertFalse($series->tasks()->whereDate('occurrence_date', '2026-08-18')->exists());
        $this->assertTrue($series->tasks()->whereDate('occurrence_date', '2026-08-19')->exists());
        $this->assertFalse($series->tasks()->whereDate('occurrence_date', '2026-08-20')->exists());
    }

    public function test_deleting_this_and_future_stops_series_and_preserves_previous_occurrences(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $firstTask = $this->createRecurringTask($user, TaskRecurrenceType::Daily);
        $series = $firstTask->series;
        $selectedTask = $series->tasks()->whereDate('occurrence_date', '2026-08-18')->firstOrFail();

        app(StopTaskSeriesFromOccurrence::class)->execute($selectedTask);

        $this->assertSame('2026-08-18', $series->refresh()->ends_before->toDateString());
        $this->assertSame(1, $series->tasks()->count());
        $this->assertTrue($series->tasks()->whereDate('occurrence_date', '2026-08-17')->exists());
        $this->assertFalse($series->tasks()->whereDate('occurrence_date', '2026-08-18')->exists());
    }

    public function test_future_series_creates_only_its_first_upcoming_occurrence(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();

        $task = app(CreateTask::class)->execute($user, new TaskData(
            title: 'Friday routine',
            scheduledDate: CarbonImmutable::parse('2026-08-21'),
            important: false,
            recurrenceType: TaskRecurrenceType::Weekdays,
            weekdays: [5],
            subtasks: [],
        ));

        $this->assertSame(['2026-08-21'], $this->occurrenceDates($task->series->tasks()->get()));
    }

    public function test_tasks_page_reveals_only_the_earliest_legacy_future_occurrence(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $firstTask = app(CreateTask::class)->execute($user, new TaskData(
            title: 'Legacy recurring Task',
            scheduledDate: CarbonImmutable::parse('2026-08-21'),
            important: false,
            recurrenceType: TaskRecurrenceType::Daily,
            weekdays: [],
            subtasks: [],
        ));

        foreach (['2026-08-22', '2026-08-23'] as $occurrenceDate) {
            $firstTask->series->tasks()->create([
                'user_id' => $user->id,
                'title' => 'Legacy recurring Task',
                'scheduled_date' => $occurrenceDate,
                'occurrence_date' => $occurrenceDate,
                'important' => false,
                'recurrence_type_snapshot' => TaskRecurrenceType::Daily,
                'recurrence_weekdays_snapshot' => [],
            ]);
        }

        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);

        $this->actingAs($user)
            ->get('/tasks')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('tasks/Index')
                ->has('upcomingTasks', 1)
                ->where('upcomingTasks.0.id', $firstTask->id)
                ->where('upcomingTasks.0.scheduledDate', '2026-08-21'));
    }

    private function occurrenceDates(Collection $tasks): array
    {
        return $tasks
            ->sortBy('occurrence_date')
            ->map(fn (Task $task) => $task->occurrence_date->toDateString())
            ->values()
            ->all();
    }

    /** @param list<int> $weekdays @param list<string> $subtasks */
    private function createRecurringTask(
        User $user,
        TaskRecurrenceType $recurrenceType,
        array $weekdays = [],
        array $subtasks = [],
    ): Task {
        return app(CreateTask::class)->execute($user, new TaskData(
            title: 'Recurring Task',
            scheduledDate: CarbonImmutable::parse('2026-08-17'),
            important: false,
            recurrenceType: $recurrenceType,
            weekdays: $weekdays,
            subtasks: array_map(fn (string $title) => new SubtaskData(null, $title), $subtasks),
        ));
    }
}
