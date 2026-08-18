<?php

namespace Tests\Feature\Today;

use App\Actions\Diary\AutosaveDiaryEntry;
use App\Actions\Habits\UpdateHabitOccurrence;
use App\Actions\Objectives\CreateObjective;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Enums\HabitScheduleType;
use App\Models\DiarySetting;
use App\Models\TodaySetting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesHabits;
use Tests\TestCase;

class TodayAggregationTest extends TestCase
{
    use CreatesHabits, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_today_aggregates_daily_modules_and_calculates_progress_from_only_daily_obligations(): void
    {
        $user = $this->todayUser();
        $completedTask = $this->task($user, 'Completed Today', '2026-08-18');
        $this->task($user, 'Pending Today', '2026-08-18');
        $this->task($user, 'Overdue Task', '2026-08-17');
        $this->task($user, 'Upcoming Task', '2026-08-19');
        app(CompleteTask::class)->execute($user, $completedTask, CarbonImmutable::now());

        $completedHabit = $this->createHabit($user, '2026-08-18', name: 'Completed Habit');
        $skippedHabit = $this->createHabit($user, '2026-08-18', name: 'Skipped Habit');
        $this->createHabit($user, '2026-08-18', name: 'Pending Habit');
        $flexibleHabit = $this->createHabit(
            $user,
            '2026-08-18',
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [3],
            flexible: true,
            name: 'Flexible Habit',
        );
        $updates = app(UpdateHabitOccurrence::class);
        $updates->toggleBoolean($user, $completedHabit, CarbonImmutable::today(), CarbonImmutable::today());
        $updates->skip($user, $skippedHabit, CarbonImmutable::today(), CarbonImmutable::today());
        $updates->toggleBoolean($user, $flexibleHabit, CarbonImmutable::today(), CarbonImmutable::today());
        $this->completeDiary($user);

        $season = $user->seasons()->where('season_number', 1)->firstOrFail();
        app(CreateObjective::class)->execute($user, $season, 'Ship Phase 8', CarbonImmutable::parse('2026-08-05'));

        $this->actingAs($user)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Home')
            ->where('today', '2026-08-18')
            ->where('currentSeason.number', 1)
            ->where('currentSeason.day', 18)
            ->where('dailyProgress.completed', 4)
            ->where('dailyProgress.total', 6)
            ->where('dailyProgress.percentage', 67)
            ->has('tasks.today', 2)
            ->has('tasks.overdue', 1)
            ->where('tasks.overdueCount', 1)
            ->where('tasks.upcomingVisible', false)
            ->has('tasks.upcoming', 0)
            ->has('habits.required', 3)
            ->has('habits.flexible', 1)
            ->where('diary.state', 'completed')
            ->where('diary.streak', 1)
            ->has('currentSeason.objectives', 1));
    }

    public function test_upcoming_visibility_depends_only_on_today_tasks_and_the_today_setting(): void
    {
        $user = $this->todayUser();
        $todayTask = $this->task($user, 'Today Task', '2026-08-18');
        $this->task($user, 'Overdue Task', '2026-08-17');
        $this->task($user, 'Upcoming Task', '2026-08-19');

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.upcomingVisible', false)
            ->has('tasks.upcoming', 0));

        app(CompleteTask::class)->execute($user, $todayTask, CarbonImmutable::now());
        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.upcomingVisible', true)
            ->has('tasks.upcoming', 1)
            ->has('tasks.overdue', 1));

        TodaySetting::query()->where('user_id', $user->id)->update(['show_upcoming_tasks' => false]);
        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.upcomingVisible', false)
            ->has('tasks.upcoming', 0));
    }

    public function test_zero_today_tasks_reveals_upcoming_and_flexible_habits_never_change_progress(): void
    {
        $user = $this->todayUser();
        $this->task($user, 'Tomorrow', '2026-08-19');
        $flexibleHabit = $this->createHabit(
            $user,
            '2026-08-18',
            schedule: HabitScheduleType::SelectedWeekdays,
            weekdays: [3],
            flexible: true,
        );
        app(UpdateHabitOccurrence::class)->toggleBoolean($user, $flexibleHabit, CarbonImmutable::today(), CarbonImmutable::today());

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.upcomingVisible', true)
            ->has('tasks.upcoming', 1)
            ->has('habits.flexible', 1)
            ->where('dailyProgress.completed', 0)
            ->where('dailyProgress.total', 1));

        TodaySetting::query()->where('user_id', $user->id)->update(['show_flexible_habits' => false]);
        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->has('habits.flexible', 0)
            ->where('dailyProgress.completed', 0)
            ->where('dailyProgress.total', 1));
    }

    public function test_today_data_is_isolated_to_the_authenticated_user(): void
    {
        $owner = $this->todayUser();
        $other = $this->todayUser('2026-08-02');
        $ownerTask = $this->task($owner, 'Owner Task', '2026-08-18');
        $otherTask = $this->task($other, 'Other Task', '2026-08-18');
        $this->createHabit($owner, '2026-08-18', name: 'Owner Habit');
        $this->createHabit($other, '2026-08-18', name: 'Other Habit');

        $this->actingAs($owner)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('tasks.today', fn (Collection $tasks): bool => $tasks->pluck('id')->all() === [$ownerTask->id]
                && ! $tasks->pluck('id')->contains($otherTask->id))
            ->where('habits.required', fn (Collection $habits): bool => $habits->pluck('name')->all() === ['Owner Habit']));
    }

    public function test_today_moves_to_the_new_current_season_without_carrying_objectives(): void
    {
        CarbonImmutable::setTestNow('2026-08-30 10:00:00');
        $user = $this->todayUser('2026-08-01');
        $firstSeason = $user->seasons()->firstOrFail();
        app(CreateObjective::class)->execute($user, $firstSeason, 'Season One Objective', CarbonImmutable::parse('2026-08-05'));

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('currentSeason.number', 1)
            ->where('currentSeason.day', 30));

        CarbonImmutable::setTestNow('2026-08-31 10:00:00');
        $secondSeason = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::today());
        $secondSeason->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('currentSeason.number', 2)
            ->where('currentSeason.day', 1)
            ->has('currentSeason.objectives', 0));
    }

    private function todayUser(string $createdOn = '2026-08-01'): User
    {
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse($createdOn),
            'updated_at' => CarbonImmutable::parse($createdOn),
        ]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::today())->update(['introduced_at' => now()]);

        return $user;
    }

    private function task(User $user, string $title, string $date)
    {
        return $user->tasks()->create([
            'title' => $title,
            'scheduled_date' => $date,
            'important' => false,
        ]);
    }

    private function completeDiary(User $user): void
    {
        DiarySetting::query()->create(['user_id' => $user->id, 'languages' => ['en']]);
        app(AutosaveDiaryEntry::class)->execute($user, CarbonImmutable::today(), [
            'content' => [['type' => 'text', 'text' => 'Today was a productive and focused day.']],
            'language_code' => 'en',
            'mood' => 'peaceful',
            'mood_group' => 'calm',
            'client_revision' => 1,
        ], CarbonImmutable::today());
    }
}
