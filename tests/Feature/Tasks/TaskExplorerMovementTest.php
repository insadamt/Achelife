<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\CreateTask;
use App\Actions\Tasks\CreateTaskFolder;
use App\Actions\Tasks\CreateTaskProject;
use App\Actions\Tasks\DeleteTaskOccurrence;
use App\Actions\Tasks\MoveTask;
use App\Actions\Tasks\ReorderTaskFolders;
use App\Data\Tasks\MoveTaskData;
use App\Data\Tasks\TaskData;
use App\Data\Tasks\TaskFolderData;
use App\Data\Tasks\TaskProjectData;
use App\Enums\TaskRecurrenceType;
use App\Models\Task;
use App\Models\TaskFolder;
use App\Models\TaskProject;
use App\Models\User;
use App\Support\Tasks\TaskExplorerViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskExplorerMovementTest extends TestCase
{
    use RefreshDatabase;

    public function test_folders_reorder_as_a_complete_normalized_root_list(): void
    {
        $user = User::factory()->create();
        [$first, $second, $third] = $this->folders($user, ['First', 'Second', 'Third']);

        $this->actingAs($user)->put('/task-folders/order', [
            'folder_ids' => [$third->id, $first->id, $second->id],
        ])->assertRedirect();

        $this->assertSame(
            [$third->id, $first->id, $second->id],
            $user->taskFolders()->orderBy('position')->pluck('id')->all(),
        );
        $this->assertSame([0, 1, 2], $user->taskFolders()->orderBy('position')->pluck('position')->all());
    }

    public function test_projects_move_and_reorder_with_separate_root_and_folder_lists(): void
    {
        $user = User::factory()->create();
        [$folder] = $this->folders($user, ['Folder']);
        $rootFirst = $this->project($user, 'Root first');
        $rootSecond = $this->project($user, 'Root second');
        $nested = $this->project($user, 'Nested', $folder->id);

        $this->actingAs($user)->put("/task-projects/{$rootSecond->id}/move", [
            'task_folder_id' => $folder->id,
            'position' => 0,
        ])->assertRedirect();
        $this->assertProjectOrder($user, null, [$rootFirst->id]);
        $this->assertProjectOrder($user, $folder->id, [$rootSecond->id, $nested->id]);

        $this->put("/task-projects/{$nested->id}/move", [
            'task_folder_id' => null,
            'position' => 0,
        ])->assertRedirect();
        $this->assertProjectOrder($user, null, [$nested->id, $rootFirst->id]);
        $this->assertProjectOrder($user, $folder->id, [$rootSecond->id]);

        $this->put('/task-projects/order', [
            'task_folder_id' => null,
            'project_ids' => [$rootFirst->id, $nested->id],
        ])->assertRedirect();
        $this->assertProjectOrder($user, null, [$rootFirst->id, $nested->id]);
    }

    public function test_tasks_move_between_projects_and_inbox_and_reorder_within_siblings(): void
    {
        $user = User::factory()->create();
        $firstProject = $this->project($user, 'First');
        $secondProject = $this->project($user, 'Second');
        $first = $this->task($user, 'First Task', $firstProject->id, 0);
        $second = $this->task($user, 'Second Task', $firstProject->id, 1);
        $inbox = $this->task($user, 'Inbox Task', null, 0);

        $this->actingAs($user)->put("/tasks/{$second->id}/move", [
            'task_project_id' => $secondProject->id,
            'position' => 0,
        ])->assertRedirect();
        $this->put("/tasks/{$inbox->id}/move", [
            'task_project_id' => $firstProject->id,
            'position' => 0,
        ])->assertRedirect();
        $this->assertTaskOrder($user, $firstProject->id, [$inbox->id, $first->id]);
        $this->assertTaskOrder($user, $secondProject->id, [$second->id]);
        $this->assertTaskOrder($user, null, []);

        $this->put('/tasks/order', [
            'task_project_id' => $firstProject->id,
            'task_ids' => [$first->id, $inbox->id],
        ])->assertRedirect();
        $this->assertTaskOrder($user, $firstProject->id, [$first->id, $inbox->id]);

        $this->put("/tasks/{$second->id}/move", [
            'task_project_id' => null,
            'position' => 0,
        ])->assertRedirect();
        $this->assertTaskOrder($user, null, [$second->id]);
    }

    public function test_recurring_task_move_updates_current_and_future_but_not_past_occurrences(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $firstProject = $this->project($user, 'First');
        $secondProject = $this->project($user, 'Second');
        $past = app(CreateTask::class)->execute($user, new TaskData(
            title: 'Recurring Task',
            scheduledDate: CarbonImmutable::parse('2026-09-12'),
            important: false,
            recurrenceType: TaskRecurrenceType::Daily,
            weekdays: [],
            subtasks: [],
            projectId: $firstProject->id,
            projectProvided: true,
        ));
        $current = $past->series->tasks()->whereDate('occurrence_date', '2026-09-13')->firstOrFail();

        app(MoveTask::class)->execute($user, $current, new MoveTaskData($secondProject->id, 0));
        app(CompleteTask::class)->execute($user, $current->refresh());
        $future = $past->series->tasks()->whereDate('occurrence_date', '2026-09-14')->firstOrFail();

        $this->assertSame($firstProject->id, $past->refresh()->task_project_id);
        $this->assertSame($secondProject->id, $current->refresh()->task_project_id);
        $this->assertSame($secondProject->id, $future->task_project_id);
        $this->assertSame($secondProject->id, $past->series->refresh()->task_project_id);
    }

    public function test_reorder_rejects_duplicate_missing_malformed_and_cross_user_ids_without_partial_changes(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        [$first, $second] = $this->folders($user, ['First', 'Second']);
        [$foreign] = $this->folders($otherUser, ['Foreign']);
        $this->actingAs($user);

        $this->put('/task-folders/order', ['folder_ids' => [$first->id, $first->id]])
            ->assertSessionHasErrors('folder_ids.1');
        $this->put('/task-folders/order', ['folder_ids' => [$first->id]])
            ->assertSessionHasErrors('folder_ids');
        $this->put('/task-folders/order', ['folder_ids' => ['invalid', $second->id]])
            ->assertSessionHasErrors('folder_ids.0');
        $this->put('/task-folders/order', ['folder_ids' => [$first->id, $foreign->id]])
            ->assertSessionHasErrors('folder_ids.1');

        $this->assertSame([$first->id, $second->id], $user->taskFolders()->orderBy('position')->pluck('id')->all());
    }

    public function test_invalid_hierarchy_and_out_of_bounds_moves_are_rejected_without_changes(): void
    {
        $user = User::factory()->create();
        [$folder] = $this->folders($user, ['Folder']);
        $project = $this->project($user, 'Project');
        $task = $this->task($user, 'Task', null, 0);
        $this->actingAs($user);

        $this->put("/task-projects/{$project->id}/move", [
            'task_project_id' => $project->id,
            'position' => 0,
        ])->assertSessionHasErrors('task_folder_id');
        $this->put("/tasks/{$task->id}/move", [
            'task_folder_id' => $folder->id,
            'position' => 0,
        ])->assertSessionHasErrors('task_project_id');
        $this->put("/tasks/{$task->id}/move", [
            'task_project_id' => null,
            'position' => 2,
        ])->assertSessionHasErrors('position');
        $this->put("/task-projects/{$project->id}", [
            'name' => 'Renamed only',
            'task_folder_id' => $folder->id,
        ])->assertRedirect();
        $this->put("/tasks/{$task->id}", [
            'title' => 'Edited only',
            'scheduled_date' => '2026-09-13',
            'important' => false,
            'recurrence_type' => null,
            'weekdays' => [],
            'subtasks' => [],
            'task_folder_id' => $folder->id,
        ])->assertRedirect();

        $this->assertNull($project->refresh()->task_folder_id);
        $this->assertNull($task->refresh()->task_project_id);
        $this->assertSame(0, $task->position);
    }

    public function test_repeated_reorder_and_move_requests_are_idempotent_and_normalized(): void
    {
        $user = User::factory()->create();
        [$first, $second] = $this->folders($user, ['First', 'Second']);
        $project = $this->project($user, 'Project');
        $task = $this->task($user, 'Task', null, 0);

        app(ReorderTaskFolders::class)->execute($user, [$second->id, $first->id]);
        app(ReorderTaskFolders::class)->execute($user, [$second->id, $first->id]);
        app(MoveTask::class)->execute($user, $task, new MoveTaskData($project->id, 0));
        app(MoveTask::class)->execute($user, $task->refresh(), new MoveTaskData($project->id, 0));

        $this->assertSame([$second->id, $first->id], $user->taskFolders()->orderBy('position')->pluck('id')->all());
        $this->assertSame([0, 1], $user->taskFolders()->orderBy('position')->pluck('position')->all());
        $this->assertTaskOrder($user, $project->id, [$task->id]);
    }

    public function test_movement_rejects_unauthorized_subjects_and_cross_user_destinations(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $ownTask = $this->task($user, 'Own Task', null, 0);
        $foreignProject = $this->project($otherUser, 'Foreign Project');
        $foreignTask = $this->task($otherUser, 'Foreign Task', $foreignProject->id, 0);
        $this->actingAs($user);

        $this->put("/tasks/{$foreignTask->id}/move", [
            'task_project_id' => null,
            'position' => 0,
        ])->assertForbidden();
        $this->put("/task-projects/{$foreignProject->id}/move", [
            'task_folder_id' => null,
            'position' => 0,
        ])->assertForbidden();
        $this->put("/tasks/{$ownTask->id}/move", [
            'task_project_id' => $foreignProject->id,
            'position' => 0,
        ])->assertSessionHasErrors('task_project_id');

        $this->assertNull($ownTask->refresh()->task_project_id);
        $this->assertSame($foreignProject->id, $foreignTask->refresh()->task_project_id);
    }

    public function test_explorer_payload_reports_only_navigation_data_and_live_open_counts(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        [$folder] = $this->folders($user, ['Folder']);
        $project = $this->project($user, 'Project', $folder->id);
        $projectTask = $this->task($user, 'Project Task', $project->id, 0);
        $completedTask = $this->task($user, 'Completed Task', $project->id, 1);
        $inboxTask = $this->task($user, 'Inbox Task', null, 0);
        app(CompleteTask::class)->execute($user, $completedTask);

        $explorer = app(TaskExplorerViewDataFactory::class)->make($user);
        $this->assertSame(1, $explorer['folders'][0]['openTaskCount']);
        $this->assertSame(1, $explorer['folders'][0]['projects'][0]['openTaskCount']);
        $this->assertSame(1, $explorer['inboxCount']);
        $this->assertArrayNotHasKey('tasks', $explorer['folders'][0]['projects'][0]);
        $this->actingAs($user)->get('/tasks')->assertInertia(fn (Assert $page) => $page
            ->component('tasks/Index')
            ->where('explorer.folders.0.id', $folder->id)
            ->where('explorer.folders.0.projects.0.id', $project->id)
            ->where('explorer.inboxCount', 1));

        app(MoveTask::class)->execute($user, $inboxTask, new MoveTaskData($project->id, 1));
        app(DeleteTaskOccurrence::class)->execute($projectTask);
        $updatedExplorer = app(TaskExplorerViewDataFactory::class)->make($user);
        $this->assertSame(1, $updatedExplorer['folders'][0]['openTaskCount']);
        $this->assertSame(0, $updatedExplorer['inboxCount']);
    }

    public function test_workspace_selects_inbox_and_owned_projects_with_manually_ordered_open_tasks(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $project = $this->project($user, 'Launch');
        $later = $this->task($user, 'Later', $project->id, 1);
        $first = $this->task($user, 'First', $project->id, 0);
        $completed = $this->task($user, 'Done', $project->id, 2);
        $this->task($user, 'Inbox', null, 0);
        app(CompleteTask::class)->execute($user, $completed);

        $this->actingAs($user)->get("/tasks?view=project&project={$project->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('workspace.view', 'project')
                ->where('workspace.projectId', $project->id)
                ->where('workspace.folderId', null)
                ->where('workspace.label', 'Launch')
                ->has('workspace.manualTasks', 2)
                ->where('workspace.manualTasks.0.id', $first->id)
                ->where('workspace.manualTasks.0.projectName', 'Launch')
                ->where('workspace.manualTasks.1.id', $later->id));

        $this->get('/tasks?view=inbox')->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'inbox')
            ->where('workspace.projectId', null)
            ->where('workspace.folderId', null)
            ->where('workspace.manualTasks.0.title', 'Inbox'));
    }

    public function test_project_task_views_and_counts_are_scoped_to_the_open_project(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $project = $this->project($user, 'Launch');
        $otherProject = $this->project($user, 'Private');
        $today = $this->task($user, 'Today', $project->id, 0);
        $overdue = $this->task($user, 'Overdue', $project->id, 1);
        $overdue->update(['scheduled_date' => '2026-09-12']);
        $upcoming = $this->task($user, 'Upcoming', $project->id, 2);
        $upcoming->update(['scheduled_date' => '2026-09-14']);
        $completed = $this->task($user, 'Completed', $project->id, 3);
        app(CompleteTask::class)->execute($user, $completed);
        $this->task($user, 'Other Project', $otherProject->id, 0);

        $this->actingAs($user)->get("/tasks?view=project&project={$project->id}&task_view=overdue")
            ->assertInertia(fn (Assert $page) => $page
                ->where('workspace.view', 'project')
                ->where('workspace.taskView', 'overdue')
                ->where('todayTasks.0.id', $today->id)
                ->has('todayTasks', 1)
                ->where('overdueTasks.data.0.id', $overdue->id)
                ->where('overdueTasks.total', 1)
                ->where('upcomingTasks.0.id', $upcoming->id)
                ->has('upcomingTasks', 1)
                ->where('completedTasks.data.0.id', $completed->id)
                ->where('completedTasks.total', 1));

        $this->get("/tasks?view=project&project={$project->id}&task_view=unknown")
            ->assertInertia(fn (Assert $page) => $page->where('workspace.taskView', 'today'));
    }

    public function test_workspace_defaults_to_files_and_opens_only_owned_folders(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        [$folder] = $this->folders($user, ['Work']);
        $project = $this->project($user, 'Launch', $folder->id);
        $otherUser = User::factory()->create();
        [$foreignFolder] = $this->folders($otherUser, ['Private']);

        $this->actingAs($user)->get('/tasks')->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'files')
            ->where('workspace.folderId', null)
            ->where('workspace.projectId', null)
            ->where('workspace.manualTasks', null));
        $this->get("/tasks?view=folder&folder={$folder->id}")->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'folder')
            ->where('workspace.folderId', $folder->id)
            ->where('workspace.label', 'Work')
            ->where('workspace.manualTasks', null)
            ->where('explorer.folders.0.projects.0.id', $project->id));
        $this->get("/tasks?view=folder&folder={$foreignFolder->id}")->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'files')
            ->where('workspace.folderId', null));
    }

    public function test_workspace_falls_back_safely_for_invalid_views_and_unowned_projects(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);
        $otherUser = User::factory()->create();
        $foreignProject = $this->project($otherUser, 'Foreign');

        $this->actingAs($user)->get('/tasks?view=unknown')->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'today')
            ->where('workspace.folderId', null)
            ->where('workspace.manualTasks', null));
        $this->get("/tasks?view=project&project={$foreignProject->id}")->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'inbox')
            ->where('workspace.projectId', null)
            ->where('workspace.folderId', null)
            ->where('workspace.manualTasks', []));
    }

    /** @param list<string> $names
     * @return list<TaskFolder>
     */
    private function folders(User $user, array $names): array
    {
        return array_map(
            fn (string $name): TaskFolder => app(CreateTaskFolder::class)->execute($user, new TaskFolderData($name)),
            $names,
        );
    }

    private function project(User $user, string $name, ?int $folderId = null): TaskProject
    {
        return app(CreateTaskProject::class)->execute($user, new TaskProjectData($name, $folderId));
    }

    private function task(User $user, string $title, ?int $projectId, int $position): Task
    {
        return $user->tasks()->create([
            'task_project_id' => $projectId,
            'title' => $title,
            'scheduled_date' => '2026-09-13',
            'important' => false,
            'position' => $position,
        ]);
    }

    /** @param list<int> $expectedIds */
    private function assertProjectOrder(User $user, ?int $folderId, array $expectedIds): void
    {
        $query = $user->taskProjects()
            ->when($folderId === null, fn ($query) => $query->whereNull('task_folder_id'))
            ->when($folderId !== null, fn ($query) => $query->where('task_folder_id', $folderId))
            ->orderBy('position');
        $this->assertSame($expectedIds, (clone $query)->pluck('id')->all());
        $this->assertSame($this->positions(count($expectedIds)), (clone $query)->pluck('position')->all());
    }

    /** @param list<int> $expectedIds */
    private function assertTaskOrder(User $user, ?int $projectId, array $expectedIds): void
    {
        $query = $user->tasks()
            ->when($projectId === null, fn ($builder) => $builder->whereNull('task_project_id'))
            ->when($projectId !== null, fn ($builder) => $builder->where('task_project_id', $projectId))
            ->orderBy('position');
        $this->assertSame($expectedIds, $query->pluck('id')->all());
        $this->assertSame($this->positions(count($expectedIds)), $query->pluck('position')->all());
    }

    /** @return list<int> */
    private function positions(int $count): array
    {
        return $count === 0 ? [] : range(0, $count - 1);
    }
}
