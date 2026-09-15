<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\DeleteTaskOccurrence;
use App\Actions\Tasks\StartTaskFocusSession;
use App\Actions\Tasks\TransitionTaskFocusSession;
use App\Enums\TaskFocusSessionState;
use App\Enums\TaskFocusTransition;
use App\Exceptions\ActiveTaskFocusSessionExists;
use App\Models\Task;
use App\Models\User;
use App\Support\Tasks\TaskFocusSessionViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TaskFocusSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_timer_uses_server_timestamps_across_repeated_pause_resume_cycles(): void
    {
        $user = User::factory()->create();
        $task = $this->task($user);
        $start = app(StartTaskFocusSession::class);
        $transition = app(TransitionTaskFocusSession::class);
        $session = $start->execute($user, $task, CarbonImmutable::parse('2026-09-13 18:00:00', 'UTC'));

        $view = app(TaskFocusSessionViewDataFactory::class)->make($session, CarbonImmutable::parse('2026-09-13 20:00:00', 'UTC'));
        $this->assertSame(7200, $view['elapsedSeconds']);
        $this->assertSame(0, $view['accumulatedSeconds']);
        $this->assertSame('2026-09-13T18:00:00+00:00', $view['openIntervalStartedAt']);
        $this->assertSame('2026-09-13T20:00:00+00:00', $view['serverTimestamp']);

        $paused = $transition->execute($user, $session, TaskFocusTransition::Pause, CarbonImmutable::parse('2026-09-13 20:00:00', 'UTC'));
        $repeatedPause = $transition->execute($user, $paused, TaskFocusTransition::Pause, CarbonImmutable::parse('2026-09-13 20:05:00', 'UTC'));
        $this->assertSame(TaskFocusSessionState::Paused, $repeatedPause->state);
        $this->assertSame(7200, $repeatedPause->accumulated_seconds);

        $running = $transition->execute($user, $repeatedPause, TaskFocusTransition::Resume, CarbonImmutable::parse('2026-09-13 20:10:00', 'UTC'));
        $repeatedResume = $transition->execute($user, $running, TaskFocusTransition::Resume, CarbonImmutable::parse('2026-09-13 20:11:00', 'UTC'));
        $completed = $transition->execute($user, $repeatedResume, TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-13 20:40:00', 'UTC'));
        $repeatedStop = $transition->execute($user, $completed, TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-13 21:00:00', 'UTC'));

        $this->assertSame(TaskFocusSessionState::Completed, $repeatedStop->state);
        $this->assertSame(9000, $repeatedStop->accumulated_seconds);
        $this->assertSame('2026-09-13T20:40:00+00:00', $repeatedStop->ended_at->toIso8601String());
        $this->assertNull($repeatedStop->active_marker);
        $this->assertCount(2, $repeatedStop->intervals);
        $this->assertSame('2026-09-13T20:10:00+00:00', $repeatedStop->intervals[1]->started_at->toIso8601String());
    }

    public function test_single_active_boundary_and_conflict_response_identify_existing_task(): void
    {
        $user = User::factory()->create();
        $firstTask = $this->task($user, 'First');
        $secondTask = $this->task($user, 'Second');
        $active = app(StartTaskFocusSession::class)->execute($user, $firstTask);

        try {
            app(StartTaskFocusSession::class)->execute($user, $secondTask);
            $this->fail('A second active session was allowed.');
        } catch (ActiveTaskFocusSessionExists $exception) {
            $this->assertSame($active->id, $exception->session->id);
            $this->assertSame($firstTask->id, $exception->session->task_id);
        }

        $this->actingAs($user)->postJson("/tasks/{$secondTask->id}/focus-sessions")
            ->assertConflict()
            ->assertJsonPath('activeSession.id', $active->id)
            ->assertJsonPath('activeSession.taskId', $firstTask->id)
            ->assertJsonPath('activeSession.taskTitle', 'First');

        $this->expectException(QueryException::class);
        $user->taskFocusSessions()->create([
            'task_id' => $secondTask->id,
            'started_at' => now(),
            'state' => 'paused',
            'source' => 'timer',
            'active_marker' => 1,
        ]);
    }

    public function test_ownership_completed_tasks_and_invalid_transitions_are_rejected(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = $this->task($owner);
        $session = app(StartTaskFocusSession::class)->execute($owner, $task, CarbonImmutable::parse('2026-09-13 10:00:00'));
        app(TransitionTaskFocusSession::class)->execute($owner, $session, TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-13 10:05:00'));

        $this->expectException(ValidationException::class);
        app(TransitionTaskFocusSession::class)->execute($owner, $session->refresh(), TaskFocusTransition::Resume);
    }

    public function test_completed_task_cannot_start_focus(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 12:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $task = $this->task($user);
        app(CompleteTask::class)->execute($user, $task);

        $this->expectException(ValidationException::class);
        app(StartTaskFocusSession::class)->execute($user, $task->refresh());
    }

    public function test_cross_user_transition_is_rejected(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $session = app(StartTaskFocusSession::class)->execute($owner, $this->task($owner));

        $this->expectException(AuthorizationException::class);
        app(TransitionTaskFocusSession::class)->execute($intruder, $session, TaskFocusTransition::Pause);
    }

    public function test_database_rejects_cross_user_task_relationship(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = $this->task($owner);

        $this->expectException(QueryException::class);
        $intruder->taskFocusSessions()->create([
            'task_id' => $task->id,
            'started_at' => now(),
            'state' => 'paused',
            'source' => 'timer',
            'active_marker' => 1,
        ]);
    }

    public function test_task_completion_finalizes_focus_without_changing_reward_rules(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 12:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $task = $this->task($user, important: true);
        $session = app(StartTaskFocusSession::class)->execute($user, $task, CarbonImmutable::parse('2026-09-13 11:50:00', 'UTC'));

        app(CompleteTask::class)->execute($user, $task, CarbonImmutable::parse('2026-09-13 12:00:00', 'UTC'));

        $this->assertSame(TaskFocusSessionState::Completed, $session->refresh()->state);
        $this->assertSame(600, $session->accumulated_seconds);
        $this->assertSame(8, $task->refresh()->earned_sp);
        $this->assertSame(8, $user->seasons()->sole()->season_points);
    }

    public function test_task_deletion_cascades_active_and_historical_focus_data(): void
    {
        $user = User::factory()->create();
        $task = $this->task($user);
        $session = app(StartTaskFocusSession::class)->execute($user, $task, CarbonImmutable::parse('2026-09-13 10:00:00'));
        app(TransitionTaskFocusSession::class)->execute($user, $session, TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-13 10:05:00'));
        $activeSession = app(StartTaskFocusSession::class)->execute($user, $task, CarbonImmutable::parse('2026-09-13 10:10:00'));

        app(DeleteTaskOccurrence::class)->execute($task);

        $this->assertModelMissing($session);
        $this->assertModelMissing($activeSession);
        $this->assertDatabaseCount('task_focus_intervals', 0);
        $this->assertDatabaseCount('task_focus_sessions', 0);
    }

    public function test_timezone_input_is_stored_and_exposed_as_utc_for_a_recurring_occurrence(): void
    {
        $user = User::factory()->create(['timezone' => 'America/Toronto']);
        $series = $user->taskSeries()->create([
            'title' => 'Recurring Focus',
            'important' => false,
            'recurrence_type' => 'daily',
            'starts_on' => '2026-09-13',
        ]);
        $task = $series->tasks()->create([
            'user_id' => $user->id,
            'title' => 'Recurring Focus',
            'scheduled_date' => '2026-09-13',
            'occurrence_date' => '2026-09-13',
            'important' => false,
            'recurrence_type_snapshot' => 'daily',
        ]);
        $session = app(StartTaskFocusSession::class)->execute(
            $user,
            $task,
            CarbonImmutable::parse('2026-09-13 09:00:00', 'America/Toronto'),
        );

        $this->assertSame('2026-09-13T13:00:00+00:00', $session->started_at->toIso8601String());
        $view = app(TaskFocusSessionViewDataFactory::class)->make($session);
        $this->assertSame('2026-09-13T13:00:00+00:00', $view['startedAt']);
        $this->assertSame('America/Toronto', $view['timezone']);
    }

    public function test_active_focus_session_is_shared_across_inertia_pages_and_clears_after_stop(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 12:05:00', 'UTC');
        $user = User::factory()->create(['created_at' => '2026-09-01', 'onboarding_completed_at' => now()]);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $task = $this->task($user, 'Global Focus');
        $session = app(StartTaskFocusSession::class)->execute(
            $user,
            $task,
            CarbonImmutable::parse('2026-09-13 12:00:00', 'UTC'),
        );

        $this->actingAs($user);

        foreach (['/home', '/seasons', '/tasks', '/habits', '/diary', '/constitution', '/money', '/settings/general'] as $moduleUrl) {
            $this->get($moduleUrl)->assertInertia(fn ($page) => $page
                ->where('activeFocusSession.id', $session->id)
                ->where('activeFocusSession.taskTitle', 'Global Focus')
                ->where('activeFocusSession.elapsedSeconds', 300)
                ->where('activeFocusSession.openIntervalStartedAt', '2026-09-13T12:00:00+00:00')
                ->where('activeFocusSession.serverTimestamp', '2026-09-13T12:05:00+00:00'));
        }

        app(TransitionTaskFocusSession::class)->execute($user, $session, TaskFocusTransition::Stop);

        $this->get('/tasks')->assertInertia(fn ($page) => $page->where('activeFocusSession', null));
    }

    private function task(User $user, string $title = 'Focus Task', bool $important = false): Task
    {
        return $user->tasks()->create([
            'title' => $title,
            'scheduled_date' => '2026-09-13',
            'important' => $important,
        ]);
    }
}
