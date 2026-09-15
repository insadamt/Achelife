<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Actions\Tasks\CreateTask;
use App\Actions\Tasks\CreateTaskFolder;
use App\Actions\Tasks\CreateTaskProject;
use App\Data\Portability\AccountRestoreRequest;
use App\Data\Tasks\TaskData;
use App\Data\Tasks\TaskFolderData;
use App\Data\Tasks\TaskProjectData;
use App\Enums\TaskRecurrenceType;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskOrganizationPortabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_format_round_trip_preserves_task_organization_and_ordering(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 12:00:00');
        $source = User::factory()->create(['timezone' => 'UTC', 'calendar_started_on' => '2026-09-01']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-09-01', 'end_date' => '2026-09-30', 'season_points' => 0]);
        $folder = app(CreateTaskFolder::class)->execute($source, new TaskFolderData('Work'));
        $project = app(CreateTaskProject::class)->execute($source, new TaskProjectData('Release', $folder->id));
        $task = app(CreateTask::class)->execute($source, new TaskData(
            title: 'Ship Phase 1',
            scheduledDate: CarbonImmutable::parse('2026-09-13'),
            important: true,
            recurrenceType: TaskRecurrenceType::Daily,
            weekdays: [],
            subtasks: [],
            projectId: $project->id,
            notes: 'Preserve these notes.',
            projectProvided: true,
            notesProvided: true,
        ));
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        $path = app(AccountArchiveExporter::class)->export($source);

        try {
            $archive = app(AccountArchiveValidator::class)->validate($path);
            app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));

            $restoredFolder = $target->taskFolders()->sole();
            $restoredProject = $target->taskProjects()->sole();
            $restoredTask = $target->tasks()->where('title', 'Ship Phase 1')->sole();
            $restoredSeries = $target->taskSeries()->sole();
            $this->assertSame(5, $archive->manifest['archive_format_version']);
            $this->assertNotSame($folder->id, $restoredFolder->id);
            $this->assertSame($restoredFolder->id, $restoredProject->task_folder_id);
            $this->assertSame($restoredProject->id, $restoredTask->task_project_id);
            $this->assertSame($restoredProject->id, $restoredSeries->task_project_id);
            $this->assertSame('Preserve these notes.', $restoredTask->notes);
            $this->assertSame('Preserve these notes.', $restoredSeries->notes);
            $this->assertSame($task->position, $restoredTask->position);
        } finally {
            @unlink($path);
        }
    }
}
