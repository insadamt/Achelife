<?php

namespace Tests\Feature\Tasks;

use App\Actions\Tasks\CreateManualTaskFocusSession;
use App\Actions\Tasks\StartTaskFocusSession;
use App\Actions\Tasks\TransitionTaskFocusSession;
use App\Actions\Tasks\UpdateCompletedTaskFocusSession;
use App\Data\Tasks\ManualFocusSessionData;
use App\Enums\TaskFocusTransition;
use App\Models\Task;
use App\Models\TaskFocusSession;
use App\Models\User;
use App\Services\Tasks\LocalFocusTimestampParser;
use App\Support\Tasks\TaskFocusHistoryViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class TaskFocusHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_manual_session_uses_the_profile_timezone_and_updates_task_history(): void
    {
        $user = User::factory()->create(['timezone' => 'America/Toronto']);
        $task = $this->task($user);

        $this->actingAs($user)->post("/tasks/{$task->id}/focus-sessions/manual", [
            'started_at' => '2026-09-14T09:15',
            'ended_at' => '2026-09-14T10:45',
        ])->assertRedirect();

        $session = $task->focusSessions()->with('intervals')->sole();
        $this->assertSame('manual', $session->source->value);
        $this->assertSame('completed', $session->state->value);
        $this->assertSame('2026-09-14T13:15:00+00:00', $session->started_at->toIso8601String());
        $this->assertSame('2026-09-14T14:45:00+00:00', $session->ended_at->toIso8601String());
        $this->assertSame(5400, $session->accumulated_seconds);
        $this->assertCount(1, $session->intervals);

        $history = app(TaskFocusHistoryViewDataFactory::class)->make($task);
        $this->assertSame(5400, $history['totalSeconds']);
        $this->assertSame('2026-09-14T09:15', $history['sessions'][0]['localStartedAt']);
        $this->assertSame('2026-09-14T10:45', $history['sessions'][0]['localEndedAt']);
    }

    public function test_timer_history_preserves_pause_gaps_but_reports_actual_focus_duration(): void
    {
        $user = User::factory()->create();
        $task = $this->task($user);
        $session = app(StartTaskFocusSession::class)->execute($user, $task, CarbonImmutable::parse('2026-09-14 09:00:00', 'UTC'));
        $transition = app(TransitionTaskFocusSession::class);
        $transition->execute($user, $session, TaskFocusTransition::Pause, CarbonImmutable::parse('2026-09-14 09:20:00', 'UTC'));
        $transition->execute($user, $session->refresh(), TaskFocusTransition::Resume, CarbonImmutable::parse('2026-09-14 09:40:00', 'UTC'));
        $transition->execute($user, $session->refresh(), TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-14 10:00:00', 'UTC'));

        $history = app(TaskFocusHistoryViewDataFactory::class)->make($task);
        $this->assertSame(2400, $history['totalSeconds']);
        $this->assertSame(2, $history['sessions'][0]['intervalCount']);
        $this->assertSame('2026-09-14T09:00:00+00:00', $history['sessions'][0]['startedAt']);
        $this->assertSame('2026-09-14T10:00:00+00:00', $history['sessions'][0]['endedAt']);
    }

    public function test_completed_timer_session_can_be_corrected_to_one_interval_and_deleted_with_confirmation_endpoint(): void
    {
        $user = User::factory()->create();
        $task = $this->task($user);
        $session = $this->completedTimerSession($user, $task, '09:00', '10:00');

        $this->actingAs($user)->put("/task-focus-sessions/{$session->id}", [
            'started_at' => '2026-09-14T09:10',
            'ended_at' => '2026-09-14T09:55',
        ])->assertRedirect();

        $session->refresh()->load('intervals');
        $this->assertSame('timer', $session->source->value);
        $this->assertSame(2700, $session->accumulated_seconds);
        $this->assertCount(1, $session->intervals);
        $this->assertSame('2026-09-14T09:10:00+00:00', $session->intervals->sole()->started_at->toIso8601String());

        $this->delete("/task-focus-sessions/{$session->id}")->assertRedirect();
        $this->assertModelMissing($session);
        $this->assertDatabaseCount('task_focus_intervals', 0);
        $this->assertSame(0, app(TaskFocusHistoryViewDataFactory::class)->make($task)['totalSeconds']);
    }

    public function test_midnight_crossing_and_adjacent_ranges_are_accepted_while_intersections_are_rejected(): void
    {
        $user = User::factory()->create(['timezone' => 'UTC']);
        $task = $this->task($user);

        $this->createManual($user, $task, '2026-09-14 23:30:00', '2026-09-15 00:00:00');
        $adjacent = $this->createManual($user, $task, '2026-09-15 00:00:00', '2026-09-15 00:30:00');
        $this->assertSame(1800, $adjacent->accumulated_seconds);

        $this->expectException(ValidationException::class);
        $this->createManual($user, $task, '2026-09-14 23:45:00', '2026-09-15 00:15:00');
    }

    public function test_invalid_reversed_zero_and_excessive_ranges_are_rejected(): void
    {
        $user = User::factory()->create();
        $task = $this->task($user);

        foreach ([
            ['2026-09-14 10:00:00', '2026-09-14 10:00:00'],
            ['2026-09-14 11:00:00', '2026-09-14 10:00:00'],
            ['2026-09-14 10:00:00', '2026-09-15 10:00:01'],
        ] as [$start, $end]) {
            try {
                $this->createManual($user, $task, $start, $end);
                $this->fail("Invalid range {$start} to {$end} was accepted.");
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('ended_at', $exception->errors());
            }
        }
    }

    public function test_nonexistent_ambiguous_and_malformed_local_times_are_rejected(): void
    {
        $parser = app(LocalFocusTimestampParser::class);

        foreach (['2026-03-08T02:30', '2026-11-01T01:30', 'not-a-time'] as $localTime) {
            try {
                $parser->parse($localTime, 'America/New_York', 'started_at');
                $this->fail("Invalid local timestamp {$localTime} was accepted.");
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('started_at', $exception->errors());
            }
        }
    }

    public function test_manual_ranges_cannot_overlap_closed_or_current_running_intervals(): void
    {
        CarbonImmutable::setTestNow('2026-09-14 10:30:00', 'UTC');
        $user = User::factory()->create();
        $task = $this->task($user);
        $this->createManual($user, $task, '2026-09-14 08:00:00', '2026-09-14 09:00:00');
        app(StartTaskFocusSession::class)->execute($user, $task, CarbonImmutable::parse('2026-09-14 10:00:00', 'UTC'));

        foreach ([
            ['2026-09-14 08:30:00', '2026-09-14 09:30:00'],
            ['2026-09-14 10:15:00', '2026-09-14 10:45:00'],
        ] as [$start, $end]) {
            try {
                $this->createManual($user, $task, $start, $end);
                $this->fail("Overlapping range {$start} to {$end} was accepted.");
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey('started_at', $exception->errors());
            }
        }
    }

    public function test_active_and_cross_user_sessions_cannot_be_edited_or_deleted(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $task = $this->task($owner);
        $active = app(StartTaskFocusSession::class)->execute($owner, $task);
        $data = new ManualFocusSessionData(now()->subHour()->toImmutable(), now()->toImmutable());

        try {
            app(UpdateCompletedTaskFocusSession::class)->execute($owner, $active, $data);
            $this->fail('An active session was edited.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('focus', $exception->errors());
        }

        $this->actingAs($intruder)->put("/task-focus-sessions/{$active->id}", [
            'started_at' => '2026-09-14T09:00',
            'ended_at' => '2026-09-14T10:00',
        ])->assertForbidden();
        $this->delete("/task-focus-sessions/{$active->id}")->assertForbidden();
    }

    private function createManual(User $user, Task $task, string $start, string $end): TaskFocusSession
    {
        return app(CreateManualTaskFocusSession::class)->execute(
            $user,
            $task,
            new ManualFocusSessionData(CarbonImmutable::parse($start, 'UTC'), CarbonImmutable::parse($end, 'UTC')),
        );
    }

    private function completedTimerSession(User $user, Task $task, string $start, string $end): TaskFocusSession
    {
        $session = app(StartTaskFocusSession::class)->execute($user, $task, CarbonImmutable::parse("2026-09-14 {$start}:00", 'UTC'));

        return app(TransitionTaskFocusSession::class)->execute(
            $user,
            $session,
            TaskFocusTransition::Stop,
            CarbonImmutable::parse("2026-09-14 {$end}:00", 'UTC'),
        );
    }

    private function task(User $user): Task
    {
        return $user->tasks()->create([
            'title' => 'Focus history',
            'scheduled_date' => '2026-09-14',
            'important' => false,
        ]);
    }
}
