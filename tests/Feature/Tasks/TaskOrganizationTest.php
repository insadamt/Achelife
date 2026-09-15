<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\CreateTask;
use App\Actions\Tasks\CreateTaskFolder;
use App\Actions\Tasks\CreateTaskProject;
use App\Actions\Tasks\DeleteTaskFolder;
use App\Actions\Tasks\DeleteTaskProject;
use App\Actions\Tasks\UpdateTask;
use App\Data\Tasks\TaskData;
use App\Data\Tasks\TaskFolderData;
use App\Data\Tasks\TaskProjectData;
use App\Enums\TaskRecurrenceType;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TaskOrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_folder_and_project_crud_supports_root_and_folder_projects(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/task-folders', ['name' => 'Work'])->assertRedirect();
        $folder = $user->taskFolders()->sole();
        $this->post('/task-projects', ['name' => 'Inbox cleanup', 'task_folder_id' => null])->assertRedirect();
        $this->post('/task-projects', ['name' => 'Launch', 'task_folder_id' => $folder->id])->assertRedirect();
        $project = $folder->projects()->sole();

        $this->put("/task-folders/{$folder->id}", ['name' => 'Career'])->assertRedirect();
        $this->put("/task-projects/{$project->id}", ['name' => 'Release'])->assertRedirect();
        $this->put("/task-projects/{$project->id}/move", ['task_folder_id' => null, 'position' => 1])->assertRedirect();

        $this->assertSame('Career', $folder->refresh()->name);
        $this->assertSame('Release', $project->refresh()->name);
        $this->assertNull($project->task_folder_id);
        $this->assertSame([0, 1], $user->taskProjects()->whereNull('task_folder_id')->orderBy('position')->pluck('position')->all());
    }

    public function test_folder_deletion_reroots_projects_without_deleting_them(): void
    {
        $user = User::factory()->create();
        $root = app(CreateTaskProject::class)->execute($user, new TaskProjectData('Root', null));
        $folder = app(CreateTaskFolder::class)->execute($user, new TaskFolderData('Work'));
        $first = app(CreateTaskProject::class)->execute($user, new TaskProjectData('First', $folder->id));
        $second = app(CreateTaskProject::class)->execute($user, new TaskProjectData('Second', $folder->id));

        app(DeleteTaskFolder::class)->execute($user, $folder);

        $this->assertModelMissing($folder);
        $this->assertSame(
            [$root->id, $first->id, $second->id],
            $user->taskProjects()->whereNull('task_folder_id')->orderBy('position')->pluck('id')->all(),
        );
    }

    public function test_project_deletion_moves_tasks_to_inbox_and_clears_the_recurring_template(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create();
        $project = app(CreateTaskProject::class)->execute($user, new TaskProjectData('Work', null));
        $inboxTask = $user->tasks()->create(['title' => 'Inbox', 'scheduled_date' => '2026-09-13', 'position' => 0]);
        $projectTask = $this->createTask($user, $project->id, 'Project notes');
        $projectTaskIds = $projectTask->series->tasks()->orderBy('position')->pluck('id')->all();

        app(DeleteTaskProject::class)->execute($user, $project);

        $this->assertModelMissing($project);
        $this->assertNull($projectTask->refresh()->task_project_id);
        $this->assertSame('Project notes', $projectTask->notes);
        $this->assertNull($projectTask->series->refresh()->task_project_id);
        $this->assertSame([$inboxTask->id, ...$projectTaskIds], $user->tasks()->whereNull('task_project_id')->orderBy('position')->pluck('id')->all());
    }

    public function test_task_can_move_to_inbox_while_legacy_update_payload_preserves_organization(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create();
        $project = app(CreateTaskProject::class)->execute($user, new TaskProjectData('Work', null));
        $task = $this->createTask($user, $project->id, 'Keep this note', recurring: false);

        $this->actingAs($user)->put("/tasks/{$task->id}", $this->taskPayload('Renamed'))->assertRedirect();
        $this->assertSame($project->id, $task->refresh()->task_project_id);
        $this->assertSame('Keep this note', $task->notes);

        $this->put("/tasks/{$task->id}/move", [
            'task_project_id' => null,
            'position' => 0,
        ])->assertRedirect();
        $this->put("/tasks/{$task->id}", [...$this->taskPayload('Moved'), 'notes' => null])->assertRedirect();

        $this->assertNull($task->refresh()->task_project_id);
        $this->assertNull($task->notes);
    }

    public function test_recurring_project_and_notes_changes_apply_forward_only(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $firstProject = app(CreateTaskProject::class)->execute($user, new TaskProjectData('First', null));
        $secondProject = app(CreateTaskProject::class)->execute($user, new TaskProjectData('Second', null));
        $past = $this->createTask($user, $firstProject->id, 'Old notes');
        $current = $past->series->tasks()->whereDate('occurrence_date', '2026-09-13')->firstOrFail();

        app(UpdateTask::class)->execute($current, new TaskData(
            title: 'Updated recurring Task',
            scheduledDate: $current->scheduled_date,
            important: false,
            recurrenceType: TaskRecurrenceType::Daily,
            weekdays: [],
            subtasks: [],
            projectId: $secondProject->id,
            notes: 'New notes',
            projectProvided: true,
            notesProvided: true,
        ));
        app(CompleteTask::class)->execute($user, $current->refresh());
        $future = $past->series->tasks()->whereDate('occurrence_date', '2026-09-14')->firstOrFail();

        $this->assertSame($firstProject->id, $past->refresh()->task_project_id);
        $this->assertSame('Old notes', $past->notes);
        $this->assertSame($secondProject->id, $current->refresh()->task_project_id);
        $this->assertSame($secondProject->id, $future->task_project_id);
        $this->assertSame('New notes', $future->notes);
    }

    public function test_cross_user_organization_is_rejected_at_http_and_domain_boundaries(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $folder = app(CreateTaskFolder::class)->execute($owner, new TaskFolderData('Private'));
        $project = app(CreateTaskProject::class)->execute($owner, new TaskProjectData('Private', $folder->id));

        $this->actingAs($intruder)->post('/task-projects', ['name' => 'Invalid', 'task_folder_id' => $folder->id])
            ->assertSessionHasErrors('task_folder_id');
        $this->post('/tasks', [...$this->taskPayload('Invalid'), 'task_project_id' => $project->id])
            ->assertSessionHasErrors('task_project_id');
        $this->delete("/task-projects/{$project->id}")->assertForbidden();

        $this->expectException(AuthorizationException::class);
        app(DeleteTaskProject::class)->execute($intruder, $project);
    }

    public function test_database_rejects_a_cross_user_project_relationship(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $project = app(CreateTaskProject::class)->execute($owner, new TaskProjectData('Private', null));

        $this->expectException(QueryException::class);
        DB::table('tasks')->insert([
            'user_id' => $intruder->id,
            'task_project_id' => $project->id,
            'title' => 'Cross-user Task',
            'scheduled_date' => '2026-09-13',
            'important' => false,
            'position' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createTask(User $user, int $projectId, string $notes, bool $recurring = true): Task
    {
        return app(CreateTask::class)->execute($user, new TaskData(
            title: 'Organized Task',
            scheduledDate: CarbonImmutable::parse($recurring ? '2026-09-12' : '2026-09-13'),
            important: false,
            recurrenceType: $recurring ? TaskRecurrenceType::Daily : null,
            weekdays: [],
            subtasks: [],
            projectId: $projectId,
            notes: $notes,
            projectProvided: true,
            notesProvided: true,
        ));
    }

    /** @return array<string, mixed> */
    private function taskPayload(string $title): array
    {
        return [
            'title' => $title,
            'scheduled_date' => '2026-09-13',
            'important' => false,
            'recurrence_type' => null,
            'weekdays' => [],
            'subtasks' => [],
        ];
    }
}
