<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Tasks\CreateManualTaskFocusSession;
use App\Actions\Tasks\DeleteCompletedTaskFocusSession;
use App\Actions\Tasks\DeleteTaskProject;
use App\Actions\Tasks\UpdateCompletedTaskFocusSession;
use App\Actions\Tasks\UpdateTaskProject;
use App\Data\Tasks\ManualFocusSessionData;
use App\Data\Tasks\TaskProjectData;
use App\Enums\TaskFocusSessionSource;
use App\Enums\TaskFocusSessionState;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Models\TaskProject;
use App\Models\User;
use App\Services\Tasks\TaskStatistics;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskFocusStatisticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_completed_intervals_drive_focus_metrics_and_local_daily_activity(): void
    {
        CarbonImmutable::setTestNow('2026-09-15 18:00:00');
        $user = User::factory()->create(['timezone' => 'America/New_York', 'created_at' => '2026-01-01']);
        $project = $user->taskProjects()->create(['name' => 'Writing', 'position' => 0]);
        $task = $this->task($user, 'Chapter draft', $project);

        $this->focusSession($user, $task, [
            ['2026-09-15 03:30:00', '2026-09-15 05:30:00'],
            ['2026-09-15 06:00:00', '2026-09-15 06:30:00'],
        ]);
        $this->focusSession($user, $task, [['2026-09-15 14:00:00', '2026-09-15 15:00:00']]);
        $this->focusSession($user, $task, [['2026-08-15 14:00:00', '2026-08-15 14:30:00']]);
        $this->focusSession($user, $task, [['2026-09-15 17:00:00', '2026-09-15 17:30:00']], TaskFocusSessionState::Paused);

        $focus = $this->statistics($user, 'month')['focus'];

        $this->assertSame([
            'totalSeconds' => 12600,
            'sessionCount' => 2,
            'averageSessionSeconds' => 6300,
            'averageActiveDaySeconds' => 6300,
            'longestSessionSeconds' => 9000,
        ], $focus['current']);
        $this->assertSame(1800, $focus['previous']['totalSeconds']);
        $this->assertSame(1, $focus['previous']['sessionCount']);
        $this->assertSame(1800, $focus['heatmap']['days'][13]['seconds']);
        $this->assertSame(10800, $focus['heatmap']['days'][14]['seconds']);
        $this->assertSame(12600, array_sum(array_column($focus['trend']['buckets'], 'seconds')));
        $this->assertSame([['id' => $project->id, 'name' => 'Writing', 'seconds' => 12600]], $focus['projects']);
        $this->assertSame([['id' => $task->id, 'title' => 'Chapter draft', 'seconds' => 12600]], $focus['tasks']);
    }

    public function test_focus_is_split_across_calendar_and_season_boundaries(): void
    {
        CarbonImmutable::setTestNow('2027-01-03 12:00:00');
        $user = User::factory()->create(['timezone' => 'UTC', 'created_at' => '2026-08-02']);
        $task = $this->task($user);
        $this->focusSession($user, $task, [['2026-12-31 23:30:00', '2027-01-01 00:30:00']]);
        $this->focusSession($user, $task, [['2026-08-31 23:30:00', '2026-09-01 00:30:00']]);

        $january = $this->statistics($user, 'month', '2027-01')['focus'];
        $this->assertSame(1800, $january['current']['totalSeconds']);
        $this->assertSame(1800, $january['previous']['totalSeconds']);
        $this->assertSame(1, $january['current']['sessionCount']);
        $this->assertSame(1, $january['previous']['sessionCount']);

        $year = $this->statistics($user, 'year', '2027')['focus'];
        $this->assertSame(1800, $year['current']['totalSeconds']);
        $this->assertSame(5400, $year['previous']['totalSeconds']);

        $seasonTwo = $this->statistics($user, 'season', '2')['focus'];
        $this->assertSame(1800, $seasonTwo['current']['totalSeconds']);
        $this->assertSame(1800, $seasonTwo['previous']['totalSeconds']);

        CarbonImmutable::setTestNow('2026-09-07 12:00:00');
        $manualRolloverUser = User::factory()->create([
            'timezone' => 'UTC',
            'created_at' => '2026-08-02',
            'season_rollover_preference' => 'manual',
        ]);
        $intermissionTask = $this->task($manualRolloverUser);
        $this->focusSession($manualRolloverUser, $intermissionTask, [['2026-09-06 10:00:00', '2026-09-06 11:00:00']]);

        $this->assertSame(0, $this->statistics($manualRolloverUser, 'season')['focus']['current']['totalSeconds']);
        $this->assertSame(3600, $this->statistics($manualRolloverUser, 'month')['focus']['current']['totalSeconds']);
    }

    public function test_project_and_task_rankings_follow_current_organization_and_deletion(): void
    {
        CarbonImmutable::setTestNow('2026-09-15 18:00:00');
        $user = User::factory()->create(['created_at' => '2026-01-01']);
        $project = $user->taskProjects()->create(['name' => 'Original', 'position' => 0]);
        $projectTask = $this->task($user, 'Project task', $project);
        $inboxTask = $this->task($user, 'Inbox task');
        $this->focusSession($user, $projectTask, [['2026-09-10 09:00:00', '2026-09-10 11:00:00']]);
        $this->focusSession($user, $inboxTask, [['2026-09-10 12:00:00', '2026-09-10 13:00:00']]);

        app(UpdateTaskProject::class)->execute($user, $project, new TaskProjectData('Renamed', null));
        $ranked = $this->statistics($user, 'month')['focus'];
        $this->assertSame('Renamed', $ranked['projects'][0]['name']);
        $this->assertSame('Inbox', $ranked['projects'][1]['name']);

        app(DeleteTaskProject::class)->execute($user, $project->refresh());
        $inbox = $this->statistics($user, 'month')['focus'];
        $this->assertSame([['id' => null, 'name' => 'Inbox', 'seconds' => 10800]], $inbox['projects']);

        $projectTask->refresh()->delete();
        $afterDeletion = $this->statistics($user, 'month')['focus'];
        $this->assertSame(3600, $afterDeletion['current']['totalSeconds']);
        $this->assertSame([['id' => $inboxTask->id, 'title' => 'Inbox task', 'seconds' => 3600]], $afterDeletion['tasks']);
    }

    public function test_timezone_changes_reattribute_completed_intervals_without_snapshots(): void
    {
        CarbonImmutable::setTestNow('2026-09-02 12:00:00');
        $user = User::factory()->create(['timezone' => 'UTC', 'created_at' => '2026-01-01']);
        $task = $this->task($user);
        $this->focusSession($user, $task, [['2026-09-01 00:30:00', '2026-09-01 01:30:00']]);

        $utc = $this->statistics($user, 'month')['focus'];
        $this->assertSame(3600, $utc['current']['totalSeconds']);
        $this->assertSame(3600, $utc['heatmap']['days'][0]['seconds']);

        $user->update(['timezone' => 'America/New_York']);
        $local = $this->statistics($user->refresh(), 'month')['focus'];
        $this->assertSame(0, $local['current']['totalSeconds']);
        $this->assertSame(3600, $local['previous']['totalSeconds']);
    }

    public function test_manual_corrections_deletions_and_paused_sessions_update_totals(): void
    {
        CarbonImmutable::setTestNow('2026-09-15 18:00:00');
        $user = User::factory()->create(['created_at' => '2026-01-01']);
        $task = $this->task($user);
        $manual = app(CreateManualTaskFocusSession::class)->execute($user, $task, new ManualFocusSessionData(
            CarbonImmutable::parse('2026-09-15 09:00:00', 'UTC'),
            CarbonImmutable::parse('2026-09-15 10:00:00', 'UTC'),
        ));
        $this->focusSession($user, $task, [['2026-09-15 11:00:00', '2026-09-15 11:45:00']], TaskFocusSessionState::Paused);

        $this->assertSame(3600, $this->statistics($user, 'month')['focus']['current']['totalSeconds']);

        app(UpdateCompletedTaskFocusSession::class)->execute($user, $manual, new ManualFocusSessionData(
            CarbonImmutable::parse('2026-09-15 09:00:00', 'UTC'),
            CarbonImmutable::parse('2026-09-15 09:30:00', 'UTC'),
        ));
        $this->assertSame(1800, $this->statistics($user, 'month')['focus']['current']['totalSeconds']);

        app(DeleteCompletedTaskFocusSession::class)->execute($user, $manual->refresh());
        $this->assertSame(0, $this->statistics($user, 'month')['focus']['current']['totalSeconds']);
    }

    public function test_empty_focus_period_is_stable_and_exposed_on_the_statistics_page(): void
    {
        CarbonImmutable::setTestNow('2026-09-07 12:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);

        $focus = $this->statistics($user, 'month')['focus'];
        $this->assertSame([
            'totalSeconds' => 0,
            'sessionCount' => 0,
            'averageSessionSeconds' => 0,
            'averageActiveDaySeconds' => 0,
            'longestSessionSeconds' => 0,
        ], $focus['current']);
        $this->assertCount(7, $focus['heatmap']['days']);
        $this->assertSame([], $focus['projects']);
        $this->assertSame([], $focus['tasks']);

        $user->seasons()->where('season_number', 1)->update(['introduced_at' => now()]);
        $response = $this->actingAs($user)->get('/tasks/statistics?statistics_period=month');
        $response->assertOk()->assertInertia(fn ($page) => $page
            ->where('statistics.focus.current.totalSeconds', 0)
            ->has('statistics.focus.heatmap.days', 7)
            ->where('statistics.current.completed', 0));
    }

    private function statistics(User $user, string $filter, ?string $selectionValue = null): array
    {
        return app(TaskStatistics::class)->summarize(
            $user,
            app(ResolveUserSeasonCycle::class)->execute($user),
            $filter,
            $selectionValue,
        );
    }

    /** @param array<int, array{0: string, 1: ?string}> $intervals */
    private function focusSession(User $user, Task $task, array $intervals, TaskFocusSessionState $state = TaskFocusSessionState::Completed): TaskFocusSession
    {
        $startedAt = CarbonImmutable::parse($intervals[0][0], 'UTC');
        $endedAt = collect($intervals)->pluck(1)->filter()->last();
        $session = $task->focusSessions()->create([
            'user_id' => $user->id,
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
            'accumulated_seconds' => collect($intervals)->sum(fn (array $interval): int => $interval[1] === null ? 0 : (int) CarbonImmutable::parse($interval[0], 'UTC')->diffInSeconds(CarbonImmutable::parse($interval[1], 'UTC'))),
            'state' => $state,
            'source' => TaskFocusSessionSource::Timer,
            'active_marker' => $state === TaskFocusSessionState::Completed ? null : 1,
        ]);

        foreach ($intervals as [$start, $end]) {
            $session->intervals()->create(['started_at' => $start, 'ended_at' => $end]);
        }

        return $session;
    }

    private function task(User $user, string $title = 'Focus task', ?TaskProject $project = null): Task
    {
        return $user->tasks()->create([
            'task_project_id' => $project?->id,
            'title' => $title,
            'scheduled_date' => '2026-09-15',
            'important' => false,
        ]);
    }
}
