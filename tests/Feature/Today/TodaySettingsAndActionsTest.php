<?php

namespace Tests\Feature\Today;

use App\Actions\Constitution\CreateLaw;
use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Objectives\CreateObjective;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\LawSeverity;
use App\Enums\MoneyCategoryType;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class TodaySettingsAndActionsTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_today_settings_default_on_persist_per_user_and_require_authentication(): void
    {
        $firstUser = $this->todayUser();
        $secondUser = $this->todayUser('2026-08-02');

        $this->actingAs($firstUser)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('settings.showFlexibleHabits', true)
            ->where('settings.showUpcomingTasks', true));

        $this->actingAs($firstUser)->put('/today/settings', [
            'show_flexible_habits' => false,
            'show_upcoming_tasks' => false,
        ])->assertRedirect();

        $this->assertDatabaseHas('today_settings', [
            'user_id' => $firstUser->id,
            'show_flexible_habits' => false,
            'show_upcoming_tasks' => false,
        ]);
        $this->actingAs($secondUser)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('settings.showFlexibleHabits', true)
            ->where('settings.showUpcomingTasks', true));

        auth()->logout();
        $this->put('/today/settings', [
            'show_flexible_habits' => false,
            'show_upcoming_tasks' => false,
        ])->assertRedirect('/login');
    }

    public function test_objective_and_constitution_actions_refresh_season_sp_without_changing_daily_progress(): void
    {
        $user = $this->todayUser();
        $season = $user->seasons()->firstOrFail();
        $objective = app(CreateObjective::class)->execute($user, $season, 'Finish Today', CarbonImmutable::parse('2026-08-05'));
        $law = app(CreateLaw::class)->execute($user, 'No distractions', LawSeverity::Minor);

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('dailyProgress.completed', 0)
            ->where('dailyProgress.total', 1)
            ->has('constitution.laws', 1));

        $this->from('/home')->post("/seasons/{$season->id}/objectives/{$objective->id}/toggle")->assertRedirect('/home');
        $this->assertSame(300, $season->refresh()->season_points);
        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('dailyProgress.completed', 0)
            ->where('dailyProgress.total', 1)
            ->where('currentSeason.seasonPoints', 300)
            ->where('currentSeason.objectives.0.completed', true));

        $this->from('/home')->post("/constitution/laws/{$law->id}/violations", ['date' => '2026-08-18'])->assertRedirect('/home');
        $this->assertSame(290, $season->refresh()->season_points);
        $this->assertDatabaseHas('violations', [
            'law_id' => $law->id,
            'sequence_number' => 1,
            'penalty_sp' => -10,
        ]);

        $this->from('/home')->post("/seasons/{$season->id}/objectives/{$objective->id}/toggle")->assertRedirect('/home');
        $this->assertSame(-10, $season->refresh()->season_points);
    }

    public function test_completing_an_overdue_task_from_today_does_not_change_daily_progress(): void
    {
        $user = $this->todayUser();
        $task = $user->tasks()->create([
            'title' => 'Overdue paperwork',
            'scheduled_date' => '2026-08-17',
            'important' => false,
        ]);

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->has('tasks.overdue', 1)
            ->where('dailyProgress.completed', 0)
            ->where('dailyProgress.total', 1));

        $this->from('/home')->post("/tasks/{$task->id}/completion")->assertRedirect('/home');

        $this->get('/home')->assertInertia(fn (Assert $page) => $page
            ->has('tasks.overdue', 0)
            ->where('dailyProgress.completed', 0)
            ->where('dailyProgress.total', 1));
        $this->assertSame(2, $task->refresh()->earned_sp);
    }

    public function test_money_quick_action_endpoints_preserve_sp_and_derive_balances_per_currency(): void
    {
        $user = $this->todayUser();
        $season = $user->seasons()->firstOrFail();
        $season->update(['season_points' => 42]);
        $bank = $this->moneyAccount($user, 'Bank', 'MAD', 100000);
        $cash = $this->moneyAccount($user, 'Cash', 'MAD');
        $usd = $this->moneyAccount($user, 'USD Wallet', 'USD', 5000);
        $income = $this->moneyCategory($user, MoneyCategoryType::Income, 'Salary');
        $expense = $this->moneyCategory($user, MoneyCategoryType::Expense, 'Food');

        $this->actingAs($user)->from('/home')->post('/money/transactions', [
            'type' => 'income', 'amount' => '200.00', 'account_id' => $bank->id,
            'category_id' => $income->id, 'date' => '2026-08-18',
        ])->assertRedirect('/home');
        $this->from('/home')->post('/money/transactions', [
            'type' => 'expense', 'amount' => '50.00', 'account_id' => $bank->id,
            'category_id' => $expense->id, 'date' => '2026-08-18',
        ])->assertRedirect('/home');
        $this->from('/home')->post('/money/transactions', [
            'type' => 'transfer', 'amount' => '100.00', 'account_id' => $bank->id,
            'destination_account_id' => $cash->id, 'date' => '2026-08-18',
        ])->assertRedirect('/home');

        $this->assertSame(42, $season->refresh()->season_points);
        $this->assertDatabaseCount('money_transactions', 3);
        $this->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('money.totalsByCurrency.MAD', 115000)
            ->where('money.totalsByCurrency.USD', 5000)
            ->where('money.canTransfer', true)
            ->where('currentSeason.seasonPoints', 42));

        $this->assertNotSame($usd->currency, $bank->currency);
    }

    public function test_archived_and_other_users_capabilities_are_not_exposed_on_today(): void
    {
        $user = $this->todayUser();
        $other = $this->todayUser('2026-08-02');
        $activeLaw = app(CreateLaw::class)->execute($user, 'Active Law', LawSeverity::Major);
        $archivedLaw = app(CreateLaw::class)->execute($user, 'Archived Law', LawSeverity::Minor);
        $archivedLaw->update(['archived_at' => now()]);
        app(CreateLaw::class)->execute($other, 'Other Law', LawSeverity::Critical);
        $this->moneyAccount($other, 'Other Account');

        $this->actingAs($user)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->has('constitution.laws', 1)
            ->where('constitution.laws.0.id', $activeLaw->id)
            ->has('money.accounts', 0));
    }

    private function todayUser(string $createdOn = '2026-08-01'): User
    {
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse($createdOn),
            'updated_at' => CarbonImmutable::parse($createdOn),
        ]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::today())->update(['introduced_at' => now()]);
        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::today());

        return $user;
    }
}
