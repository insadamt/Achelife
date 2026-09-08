<?php

namespace Tests\Feature\Tasks;

use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\MarkTaskIncomplete;
use App\Models\Task;
use App\Models\User;
use App\Services\Tasks\TaskStatistics;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TaskStatisticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_month_uses_full_previous_month_and_local_completion_dates(): void
    {
        CarbonImmutable::setTestNow('2026-09-07 12:00:00');
        $user = User::factory()->create(['timezone' => 'America/New_York', 'created_at' => '2026-01-01']);
        $this->completion($user, '2026-09-01 03:30:00', 'late', 4);
        $this->completion($user, '2026-08-31 12:00:00', 'early', 16);
        $this->completion($user, '2026-09-01 04:30:00', 'on_time', 8, true);
        $this->completion($user, '2026-09-06 12:00:00', 'late', 2);
        $this->completion(User::factory()->create(), '2026-09-06 12:00:00', 'early', 16);
        $stats = $this->statistics($user, 'month');

        $this->assertSame(['completed' => 2, 'sp' => 10, 'important' => 1, 'onTime' => 50.0], $stats['current']);
        $this->assertSame(2, $stats['previous']['completed']);
        $this->assertSame(20, $stats['previous']['sp']);
        $this->assertCount(7, $stats['trend']['buckets']);
        $this->assertSame(1, $stats['trend']['buckets'][0]['count']);
        $this->assertSame(8, $stats['trend']['buckets'][0]['sp']);
        $this->assertSame(0, $stats['trend']['buckets'][1]['count']);
        $this->assertSame(0, $stats['trend']['buckets'][1]['sp']);

        $august = $this->statistics($user, 'month', '2026-08');
        $this->assertSame('August 2026', $august['label']);
        $this->assertSame(2, $august['current']['completed']);
        $this->assertSame('2026-07', $august['selector']['previousValue']);
        $this->assertSame('2026-09', $august['selector']['nextValue']);
    }

    public function test_year_includes_full_previous_december_and_all_time_has_no_baseline(): void
    {
        CarbonImmutable::setTestNow('2026-02-07 12:00:00');
        $user = User::factory()->create(['created_at' => '2025-01-01']);
        $this->completion($user, '2025-12-31 23:00:00', 'early', 16);
        $this->completion($user, '2026-02-01 12:00:00', 'on_time', 8);
        $year = $this->statistics($user, 'year');
        $this->assertSame(1, $year['previous']['completed']);
        $this->assertSame(1, $year['current']['completed']);
        $this->assertSame([0, 1], array_column($year['trend']['buckets'], 'count'));
        $all = $this->statistics($user, 'all');
        $this->assertNull($all['previous']);
        $this->assertNull($all['comparisonLabel']);
        $this->assertSame(2, $all['current']['completed']);
        $this->assertNull($all['selector']['value']);

        $previousYear = $this->statistics($user, 'year', '2025');
        $this->assertSame('2025', $previousYear['label']);
        $this->assertSame('2026', $previousYear['selector']['nextValue']);
    }

    public function test_season_compares_full_previous_season_even_on_first_day(): void
    {
        CarbonImmutable::setTestNow('2026-09-01 12:00:00');
        $user = User::factory()->create(['created_at' => '2026-08-02']);
        $this->completion($user, '2026-08-31 12:00:00', 'early', 16);
        $this->completion($user, '2026-09-01 10:00:00', 'on_time', 8);
        $stats = $this->statistics($user, 'season');
        $this->assertSame('Season 2', $stats['label']);
        $this->assertSame(1, $stats['previous']['completed']);
        $this->assertSame(1, $stats['current']['completed']);
        $this->assertCount(1, $stats['trend']['buckets']);

        $seasonOne = $this->statistics($user, 'season', '1');
        $this->assertSame('Season 1', $seasonOne['label']);
        $this->assertNull($seasonOne['selector']['previousValue']);
        $this->assertSame('2', $seasonOne['selector']['nextValue']);
    }

    public function test_empty_first_season_and_intermission_are_explicit(): void
    {
        CarbonImmutable::setTestNow('2026-08-02 12:00:00');
        $user = User::factory()->create(['created_at' => '2026-08-02', 'season_rollover_preference' => 'manual']);
        $stats = $this->statistics($user, 'season');
        $this->assertNull($stats['previous']);
        $this->assertNull($stats['current']['onTime']);
        CarbonImmutable::setTestNow('2026-09-07 12:00:00');
        $stats = $this->statistics($user, 'season');
        $this->assertSame('Season 1', $stats['label']);
        $this->assertCount(30, $stats['trend']['buckets']);
    }

    public function test_completion_reversal_updates_statistics_and_page_exposes_selected_filter(): void
    {
        CarbonImmutable::setTestNow('2026-09-07 12:00:00');
        $user = User::factory()->create(['created_at' => '2026-09-01']);
        $cycle = app(ResolveUserSeasonCycle::class)->execute($user);
        $cycle->activeSeason->update(['introduced_at' => now()]);
        $task = $user->tasks()->create(['title' => 'Finish report', 'scheduled_date' => '2026-09-07', 'important' => true]);
        app(CompleteTask::class)->execute($user, $task);
        $this->assertSame(1, $this->statistics($user, 'month')['current']['completed']);
        app(MarkTaskIncomplete::class)->execute($user, $task);
        $this->actingAs($user)->get('/tasks/statistics?statistics_period=month')->assertInertia(fn (Assert $page) => $page
            ->component('tasks/Statistics')
            ->missing('todayTasks')
            ->where('statistics.filter', 'month')
            ->where('statistics.current.completed', 0));
        $this->get('/tasks/statistics?statistics_period=month&statistics_value=2026-08')->assertInertia(fn (Assert $page) => $page
            ->where('statistics.label', 'August 2026')
            ->where('statistics.selector.nextValue', '2026-09'));
        $this->get('/tasks')->assertInertia(fn (Assert $page) => $page
            ->component('tasks/Index')->missing('statistics')->has('todayTasks'));
        $this->get('/tasks/statistics?statistics_period=invalid')->assertSessionHasErrors('statistics_period');
    }

    private function statistics(User $user, string $filter, ?string $selectionValue = null): array
    {
        return app(TaskStatistics::class)->summarize($user, app(ResolveUserSeasonCycle::class)->execute($user), $filter, $selectionValue);
    }

    private function completion(User $user, string $completedAt, string $timing, int $points, bool $important = false): Task
    {
        return $user->tasks()->create([
            'title' => 'Historical completion', 'scheduled_date' => '2025-01-01',
            'completed_at' => $completedAt, 'completion_timing' => $timing,
            'earned_sp' => $points, 'importance_at_completion' => $important, 'important' => false,
        ]);
    }
}
