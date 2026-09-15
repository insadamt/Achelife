<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Models\Task;
use App\Models\TaskProject;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskSearchAndDetailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_notes_can_be_created_edited_and_returned_in_task_details(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = $this->seasonUser();
        $project = $user->taskProjects()->create(['name' => 'Launch', 'position' => 0]);

        $this->actingAs($user)->post('/tasks', [
            ...$this->taskPayload('Write brief'),
            'task_project_id' => $project->id,
            'notes' => "Audience: early adopters\nInclude rollout risks.",
        ])->assertRedirect();
        $task = $user->tasks()->sole();

        $this->get('/tasks?search=rollout')->assertInertia(fn (Assert $page) => $page
            ->has('searchResults.data', 1)
            ->where('searchResults.data.0.id', $task->id)
            ->where('searchResults.data.0.notes', "Audience: early adopters\nInclude rollout risks.")
            ->where('searchResults.data.0.projectName', 'Launch'));

        $this->put("/tasks/{$task->id}", [
            ...$this->taskPayload('Write launch brief'),
            'task_project_id' => null,
            'notes' => 'Updated notes',
        ])->assertRedirect();

        $this->assertNull($task->refresh()->task_project_id);
        $this->assertSame('Updated notes', $task->notes);
    }

    public function test_search_is_global_case_insensitive_and_treats_special_characters_literally(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = $this->seasonUser();
        $project = $user->taskProjects()->create(['name' => 'Work', 'position' => 0]);
        $titleMatch = $this->createTask($user, 'Quarterly REPORT', null, $project);
        $notesMatch = $this->createTask($user, 'Review', 'Contains café_100% notes');
        $this->createTask($user, 'Unrelated', 'No match');

        $this->actingAs($user)->get('/tasks?view=inbox&search=report')->assertInertia(fn (Assert $page) => $page
            ->where('workspace.view', 'inbox')
            ->where('searchFilters.search', 'report')
            ->has('searchResults.data', 1)
            ->where('searchResults.data.0.id', $titleMatch->id));

        $this->get('/tasks?search=caf%C3%A9_100%25')->assertInertia(fn (Assert $page) => $page
            ->has('searchResults.data', 1)
            ->where('searchResults.data.0.id', $notesMatch->id));
    }

    public function test_search_filters_combine_and_remain_user_scoped(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = $this->seasonUser();
        $otherUser = $this->seasonUser();
        $project = $user->taskProjects()->create(['name' => 'Work', 'position' => 0]);
        $otherProject = $otherUser->taskProjects()->create(['name' => 'Private', 'position' => 0]);
        $match = $this->createTask($user, 'Ship release', 'release checklist', $project, important: true);
        $completed = $this->createTask($user, 'Old release', 'release archive', $project, important: true);
        app(CompleteTask::class)->execute($user, $completed);
        $this->createTask($user, 'Inbox release', 'release', important: true);
        $this->createTask($user, 'Minor release', 'release', $project);
        $this->createTask($otherUser, 'Private release', 'release', $otherProject, important: true);

        $url = "/tasks?search=release&task_project={$project->id}&status=incomplete&important=yes&view=upcoming";
        $this->actingAs($user)->get($url)->assertInertia(fn (Assert $page) => $page
            ->has('searchResults.data', 1)
            ->where('searchResults.data.0.id', $match->id)
            ->where('searchFilters.taskProject', (string) $project->id)
            ->where('searchFilters.status', 'incomplete')
            ->where('searchFilters.important', 'yes'));

        $this->get("/tasks?task_project={$otherProject->id}")->assertInertia(fn (Assert $page) => $page
            ->where('searchFilters.taskProject', 'all')
            ->where('searchResults', null));
    }

    public function test_empty_and_long_search_values_are_normalized_safely(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = $this->seasonUser();
        $longQuery = str_repeat('x', 600);
        $match = $this->createTask($user, 'Long search', str_repeat('x', 500));

        $this->actingAs($user)->get('/tasks?search=%20%20')->assertInertia(fn (Assert $page) => $page
            ->where('searchFilters.search', '')
            ->where('searchResults', null));

        $this->get('/tasks?search='.urlencode($longQuery))->assertInertia(fn (Assert $page) => $page
            ->where('searchFilters.search', str_repeat('x', 500))
            ->has('searchResults.data', 1)
            ->where('searchResults.data.0.id', $match->id));
    }

    public function test_search_pagination_has_stable_non_overlapping_pages_and_keeps_query_parameters(): void
    {
        CarbonImmutable::setTestNow('2026-09-13 10:00:00');
        $user = $this->seasonUser();

        foreach (range(1, 27) as $index) {
            $this->createTask($user, sprintf('Indexed Task %02d', $index), 'needle', scheduledDate: '2026-09-13');
        }

        $firstResponse = $this->actingAs($user)->get('/tasks?search=needle&view=upcoming');
        $firstResponse->assertInertia(fn (Assert $page) => $page
            ->has('searchResults.data', 25)
            ->where('searchResults.current_page', 1)
            ->where('searchResults.total', 27)
            ->where('searchResults.links.2.url', fn ($url) => str_contains((string) $url, 'search=needle') && str_contains((string) $url, 'view=upcoming')));

        $firstIds = collect($firstResponse->viewData('page')['props']['searchResults']['data'])->pluck('id');
        $secondResponse = $this->get('/tasks?search=needle&view=upcoming&search_page=2');
        $secondIds = collect($secondResponse->viewData('page')['props']['searchResults']['data'])->pluck('id');

        $this->assertCount(25, $firstIds);
        $this->assertCount(2, $secondIds);
        $this->assertCount(0, $firstIds->intersect($secondIds));
        $this->assertSame(range(1, 27), $firstIds->merge($secondIds)->sort()->values()->all());
    }

    private function seasonUser(): User
    {
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);

        return $user;
    }

    private function createTask(
        User $user,
        string $title,
        ?string $notes,
        ?TaskProject $project = null,
        bool $important = false,
        string $scheduledDate = '2026-09-14',
    ): Task {
        return $user->tasks()->create([
            'task_project_id' => $project?->id,
            'title' => $title,
            'notes' => $notes,
            'scheduled_date' => $scheduledDate,
            'important' => $important,
        ]);
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
