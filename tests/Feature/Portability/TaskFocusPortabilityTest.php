<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Actions\Tasks\StartTaskFocusSession;
use App\Actions\Tasks\TransitionTaskFocusSession;
use App\Data\Portability\AccountRestoreRequest;
use App\Enums\TaskFocusSessionState;
use App\Enums\TaskFocusTransition;
use App\Exceptions\InvalidAccountArchive;
use App\Models\Season;
use App\Models\Task;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use ZipArchive;

class TaskFocusPortabilityTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $temporaryArchives = [];

    public function test_completed_and_running_focus_sessions_round_trip_without_transfer_time_inflation(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 20:10:00');
        $source = $this->portableUser();
        $completedTask = $this->task($source, 'Completed Focus');
        $runningTask = $this->task($source, 'Running Focus');
        $start = app(StartTaskFocusSession::class);
        $transition = app(TransitionTaskFocusSession::class);
        $completed = $start->execute($source, $completedTask, CarbonImmutable::parse('2026-09-13 18:00:00', 'UTC'));
        $transition->execute($source, $completed, TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-13 18:05:00', 'UTC'));
        $running = $start->execute($source, $runningTask, CarbonImmutable::parse('2026-09-13 20:00:00', 'UTC'));
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        $path = app(AccountArchiveExporter::class)->export($source);
        $this->temporaryArchives[] = $path;

        $archive = app(AccountArchiveValidator::class)->validate($path);
        app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));

        $restoredCompleted = $target->taskFocusSessions()->whereHas('task', fn ($query) => $query->where('title', 'Completed Focus'))->with('intervals')->sole();
        $restoredPaused = $target->taskFocusSessions()->whereHas('task', fn ($query) => $query->where('title', 'Running Focus'))->with('intervals')->sole();
        $this->assertSame(5, $archive->manifest['archive_format_version']);
        $this->assertSame(TaskFocusSessionState::Completed, $restoredCompleted->state);
        $this->assertSame(300, $restoredCompleted->accumulated_seconds);
        $this->assertSame(TaskFocusSessionState::Paused, $restoredPaused->state);
        $this->assertSame(600, $restoredPaused->accumulated_seconds);
        $this->assertSame(1, $restoredPaused->active_marker);
        $this->assertNull($restoredPaused->ended_at);
        $this->assertSame('2026-09-13T20:10:00+00:00', $restoredPaused->intervals->sole()->ended_at->toIso8601String());
        $this->assertSame(TaskFocusSessionState::Running, $running->refresh()->state);
        $this->assertNull($running->intervals()->sole()->ended_at);
    }

    public function test_format_four_restores_without_focus_sessions(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 12:00:00');
        $source = $this->portableUser();
        $this->task($source, 'Legacy Task');
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        $currentPath = app(AccountArchiveExporter::class)->export($source);
        $this->temporaryArchives[] = $currentPath;
        $formatFourPath = $this->downgradeToFormatFour($currentPath);
        $this->temporaryArchives[] = $formatFourPath;

        $archive = app(AccountArchiveValidator::class)->validate($formatFourPath);
        app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));

        $this->assertSame(4, $archive->manifest['archive_format_version']);
        $this->assertSame('Legacy Task', $target->tasks()->sole()->title);
        $this->assertDatabaseCount('task_focus_sessions', 0);
        $this->assertDatabaseCount('task_focus_intervals', 0);
    }

    public function test_paused_focus_session_restores_its_exact_persisted_duration(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 14:00:00');
        $source = $this->portableUser();
        $session = app(StartTaskFocusSession::class)->execute($source, $this->task($source, 'Paused Focus'), CarbonImmutable::parse('2026-09-13 12:00:00'));
        app(TransitionTaskFocusSession::class)->execute($source, $session, TaskFocusTransition::Pause, CarbonImmutable::parse('2026-09-13 12:02:00'));
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        $path = app(AccountArchiveExporter::class)->export($source);
        $this->temporaryArchives[] = $path;

        $archive = app(AccountArchiveValidator::class)->validate($path);
        app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));

        $restored = $target->taskFocusSessions()->sole();
        $this->assertSame(TaskFocusSessionState::Paused, $restored->state);
        $this->assertSame(120, $restored->accumulated_seconds);
        $this->assertSame(1, $restored->active_marker);
    }

    public function test_focus_archive_rejects_inconsistent_duration_and_interval_ordering(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 12:00:00');
        $source = $this->portableUser();
        $session = app(StartTaskFocusSession::class)->execute($source, $this->task($source, 'Validated Focus'), CarbonImmutable::parse('2026-09-13 11:50:00'));
        app(TransitionTaskFocusSession::class)->execute($source, $session, TaskFocusTransition::Stop, CarbonImmutable::parse('2026-09-13 12:00:00'));
        $path = app(AccountArchiveExporter::class)->export($source);
        $this->temporaryArchives[] = $path;

        $invalidDuration = $this->rewriteArchive($path, function (array &$entries): void {
            $session = json_decode(trim($entries['tables/task_focus_sessions.ndjson']), true, 512, JSON_THROW_ON_ERROR);
            $session['accumulated_seconds']++;
            $entries['tables/task_focus_sessions.ndjson'] = json_encode($session, JSON_THROW_ON_ERROR)."\n";
        });
        $this->assertArchiveInvalid($invalidDuration, 'duration does not match');

        $invalidInterval = $this->rewriteArchive($path, function (array &$entries): void {
            $interval = json_decode(trim($entries['tables/task_focus_intervals.ndjson']), true, 512, JSON_THROW_ON_ERROR);
            $interval['ended_at'] = '2026-09-13 11:49:59';
            $entries['tables/task_focus_intervals.ndjson'] = json_encode($interval, JSON_THROW_ON_ERROR)."\n";
        });
        $this->assertArchiveInvalid($invalidInterval, 'interval is invalid');
    }

    protected function tearDown(): void
    {
        foreach ($this->temporaryArchives as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    private function portableUser(): User
    {
        $user = User::factory()->create(['timezone' => 'UTC', 'calendar_started_on' => '2026-09-01']);
        Season::query()->create([
            'user_id' => $user->id,
            'season_number' => 1,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'season_points' => 0,
        ]);

        return $user;
    }

    private function task(User $user, string $title): Task
    {
        return $user->tasks()->create([
            'title' => $title,
            'position' => $user->tasks()->count(),
            'scheduled_date' => '2026-09-13',
            'important' => false,
        ]);
    }

    private function downgradeToFormatFour(string $sourcePath): string
    {
        return $this->rewriteArchive($sourcePath, function (array &$entries): void {
            $manifest = json_decode($entries['manifest.json'], true, 512, JSON_THROW_ON_ERROR);
            $manifest['archive_format_version'] = 4;

            foreach (['task_focus_sessions', 'task_focus_intervals'] as $table) {
                unset($entries["tables/{$table}.ndjson"], $manifest['table_counts'][$table]);
            }

            $manifest['files'] = array_values(array_filter(
                $manifest['files'],
                fn (string $file): bool => ! in_array($file, ['tables/task_focus_sessions.ndjson', 'tables/task_focus_intervals.ndjson'], true),
            ));
            $entries['manifest.json'] = json_encode($manifest, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n";
        });
    }

    /** @param callable(array<string, string>&): void $mutate */
    private function rewriteArchive(string $sourcePath, callable $mutate): string
    {
        $source = new ZipArchive;
        $source->open($sourcePath, ZipArchive::RDONLY);
        $entries = [];

        for ($index = 0; $index < $source->numFiles; $index++) {
            $name = $source->getNameIndex($index);
            if ($name !== false) {
                $entries[$name] = $source->getFromIndex($index);
            }
        }
        $source->close();
        $mutate($entries);
        unset($entries['checksums.json']);
        $checksums = [];

        foreach ($entries as $name => $contents) {
            $checksums[$name] = hash('sha256', $contents);
        }

        $entries['checksums.json'] = json_encode($checksums, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
        $temporaryPath = tempnam(sys_get_temp_dir(), 'achelife-format-four-');
        $path = $temporaryPath.'.achelife.zip';
        @unlink($temporaryPath);
        $output = new ZipArchive;
        $output->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        foreach ($entries as $name => $contents) {
            $output->addFromString($name, $contents);
        }

        $output->close();
        $this->temporaryArchives[] = $path;

        return $path;
    }

    private function assertArchiveInvalid(string $path, string $message): void
    {
        try {
            app(AccountArchiveValidator::class)->validate($path);
            $this->fail('The invalid Focus archive was accepted.');
        } catch (InvalidAccountArchive $exception) {
            $this->assertStringContainsString($message, $exception->getMessage());
        }
    }
}
