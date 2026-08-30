<?php

namespace Tests\Feature\Seasons;

use App\Actions\Constitution\RecordViolation;
use App\Actions\Diary\AutosaveDiaryEntry;
use App\Actions\Habits\SynchronizeHabitOccurrences;
use App\Actions\Habits\UpdateHabitOccurrence;
use App\Actions\Objectives\ToggleObjectiveCompletion;
use App\Actions\Seasons\ResolveUserSeasonCycle;
use App\Actions\Seasons\StartNextSeason;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Actions\Tasks\CompleteTask;
use App\Actions\Tasks\SynchronizeRecurringTaskOccurrences;
use App\Enums\MoneyCategoryType;
use App\Enums\MoneyTransactionType;
use App\Enums\SeasonIntermissionReason;
use App\Enums\SeasonRolloverPreference;
use App\Enums\TaskRecurrenceType;
use App\Models\DiaryEntry;
use App\Models\DiarySetting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesConstitution;
use Tests\Concerns\CreatesHabits;
use Tests\Concerns\CreatesMoney;
use Tests\Concerns\CreatesObjectives;
use Tests\TestCase;

class SeasonIntermissionTest extends TestCase
{
    use CreatesConstitution;
    use CreatesHabits;
    use CreatesMoney;
    use CreatesObjectives;
    use RefreshDatabase;

    public function test_manual_rollover_finalizes_day_thirty_and_enters_an_intermission(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $season->update(['season_points' => 550, 'introduced_at' => now()]);

        $cycle = app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::parse('2026-01-31'));

        $this->assertNull($cycle->activeSeason);
        $this->assertSame(SeasonIntermissionReason::ManualRollover, $cycle->intermission?->reason);
        $this->assertSame('silver_iii', $season->refresh()->rank);
        $this->assertNotNull($season->finalized_at);
        $this->assertDatabaseCount('seasons', 1);
    }

    public function test_one_time_hold_does_not_change_the_automatic_preference_and_clears_after_start(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Automatic);
        $user->update(['hold_next_season' => true]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));

        $cycle = app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::parse('2026-02-15'));
        $this->assertSame(SeasonIntermissionReason::OneTimeHold, $cycle->intermission?->reason);

        $nextSeason = app(StartNextSeason::class)->execute($user, CarbonImmutable::parse('2026-02-15'));

        $this->assertSame(2, $nextSeason->season_number);
        $this->assertSame('2026-02-15', $nextSeason->start_date->toDateString());
        $this->assertSame('2026-03-16', $nextSeason->end_date->toDateString());
        $this->assertFalse($user->refresh()->hold_next_season);
        $this->assertSame(SeasonRolloverPreference::Automatic, $user->season_rollover_preference);
        $this->assertSame('2026-02-15', $cycle->intermission?->refresh()->ended_before?->toDateString());
    }

    public function test_repeated_start_requests_return_the_same_active_season(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::parse('2026-03-01'));

        $first = app(StartNextSeason::class)->execute($user, CarbonImmutable::parse('2026-03-01'));
        $second = app(StartNextSeason::class)->execute($user, CarbonImmutable::parse('2026-03-01'));

        $this->assertTrue($first->is($second));
        $this->assertDatabaseCount('seasons', 2);
    }

    public function test_enabling_automatic_rollover_during_intermission_starts_today(): void
    {
        CarbonImmutable::setTestNow('2026-04-10 12:00:00');
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'))->update(['introduced_at' => now()]);
        app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::today());

        $this->actingAs($user)->put('/settings/general', [
            'timezone' => 'UTC',
            'season_rollover_preference' => 'automatic',
        ])->assertRedirect();

        $secondSeason = $user->seasons()->where('season_number', 2)->firstOrFail();
        $this->assertSame('2026-04-10', $secondSeason->start_date->toDateString());
        $this->assertSame('2026-05-09', $secondSeason->end_date->toDateString());
    }

    public function test_saving_other_settings_does_not_resolve_an_automatic_users_hold(): void
    {
        CarbonImmutable::setTestNow('2026-02-15 12:00:00');
        $user = $this->userWithPreference(SeasonRolloverPreference::Automatic);
        $user->update(['hold_next_season' => true]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'))->update(['introduced_at' => now()]);
        app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::today());

        $this->actingAs($user)->put('/settings/general', [
            'timezone' => 'Europe/Paris',
            'season_rollover_preference' => 'automatic',
        ])->assertRedirect();

        $this->assertDatabaseCount('seasons', 1);
        $this->assertTrue($user->refresh()->hold_next_season);
    }

    public function test_rewarded_task_completion_is_blocked_during_intermission(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $task = $user->tasks()->create([
            'title' => 'Plan without reward',
            'scheduled_date' => '2026-02-15',
            'important' => false,
        ]);

        $this->expectException(ValidationException::class);
        app(CompleteTask::class)->execute($user, $task, CarbonImmutable::parse('2026-02-15 12:00:00'));
    }

    public function test_recurring_tasks_resume_on_the_new_season_without_gap_occurrences(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $series = $user->taskSeries()->create([
            'title' => 'Daily planning',
            'important' => false,
            'recurrence_type' => TaskRecurrenceType::Daily,
            'weekdays' => null,
            'starts_on' => '2026-01-30',
        ]);
        app(SynchronizeRecurringTaskOccurrences::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        app(SynchronizeRecurringTaskOccurrences::class)->execute($user, CarbonImmutable::parse('2026-02-15'));

        app(StartNextSeason::class)->execute($user, CarbonImmutable::parse('2026-03-01'));
        app(SynchronizeRecurringTaskOccurrences::class)->execute($user, CarbonImmutable::parse('2026-03-01'));

        $this->assertSame(
            ['2026-01-30', '2026-03-01'],
            $series->tasks()->orderBy('occurrence_date')->pluck('occurrence_date')->map(fn ($date) => CarbonImmutable::parse($date)->toDateString())->all(),
        );
    }

    public function test_intermission_dashboard_and_historical_module_pages_remain_available(): void
    {
        CarbonImmutable::setTestNow('2026-02-15 12:00:00');
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'))->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Intermission')
            ->where('cycle.state', 'intermission')
            ->where('cycle.nextSeasonNumber', 2));

        foreach (['/tasks', '/habits', '/diary', '/constitution', '/money', '/settings/general'] as $path) {
            $this->get($path)->assertOk();
        }
    }

    public function test_season_bound_module_mutations_are_blocked_during_intermission(): void
    {
        CarbonImmutable::setTestNow('2026-01-01 10:00:00');
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-01'));
        $objective = $this->createObjective($user, $season, today: '2026-01-01');
        $habit = $this->createHabit($user, '2026-01-01');
        $law = $this->createLaw($user, createdOn: '2026-01-01');
        $task = $user->tasks()->create([
            'title' => 'Complete during a Season',
            'scheduled_date' => '2026-02-15',
            'important' => false,
        ]);
        $intermissionDate = CarbonImmutable::parse('2026-02-15');
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        app(ResolveUserSeasonCycle::class)->execute($user, $intermissionDate);

        $blockedMutations = [
            fn () => app(CompleteTask::class)->execute($user, $task, $intermissionDate),
            fn () => app(UpdateHabitOccurrence::class)->toggleBoolean($user, $habit, $intermissionDate, $intermissionDate),
            fn () => app(AutosaveDiaryEntry::class)->execute($user, $intermissionDate, [
                'content' => [['type' => 'paragraph', 'children' => [['text' => 'Intermission writing is read-only.']]]],
                'language_code' => null,
                'mood_group' => null,
                'mood' => null,
                'client_revision' => 1,
            ], $intermissionDate),
            fn () => app(RecordViolation::class)->execute($user, $law, $intermissionDate, $intermissionDate),
            fn () => app(ToggleObjectiveCompletion::class)->execute($objective, $intermissionDate),
        ];

        foreach ($blockedMutations as $blockedMutation) {
            try {
                $blockedMutation();
                $this->fail('Season-bound mutations must fail during intermission.');
            } catch (ValidationException) {
                $this->addToAssertionCount(1);
            }
        }

        $this->assertNull($task->refresh()->completed_at);
        $this->assertDatabaseMissing('habit_occurrences', ['habit_id' => $habit->id, 'occurrence_date' => '2026-02-15']);
        $this->assertDatabaseMissing('diary_entries', ['user_id' => $user->id, 'entry_date' => '2026-02-15']);
        $this->assertDatabaseMissing('violations', ['law_id' => $law->id, 'violation_date' => '2026-02-15']);
        $this->assertNull($objective->refresh()->completed_at);
    }

    public function test_nonseasonal_planning_money_and_settings_remain_writable_during_intermission(): void
    {
        CarbonImmutable::setTestNow('2026-02-15 10:00:00');
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::today());

        $this->actingAs($user)->post('/tasks', [
            'title' => 'Plan the next Season',
            'scheduled_date' => '2026-03-01',
            'important' => true,
            'subtasks' => [],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $account = $this->moneyAccount($user, initialMinor: 5000);
        $category = $this->moneyCategory($user, MoneyCategoryType::Expense, 'Rest');
        $transaction = $this->moneyTransaction(
            $user,
            MoneyTransactionType::Expense,
            $account,
            1200,
            category: $category,
            date: '2026-02-15',
        );
        $law = $this->createLaw($user, name: 'Intermission law', createdOn: '2026-02-15');

        $this->put('/settings/general', [
            'timezone' => 'Africa/Casablanca',
            'season_rollover_preference' => 'manual',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertDatabaseHas('tasks', ['user_id' => $user->id, 'title' => 'Plan the next Season']);
        $this->assertSame('2026-02-15', $transaction->transaction_date->toDateString());
        $this->assertSame('Intermission law', $law->name);
        $this->assertSame('Africa/Casablanca', $user->refresh()->timezone);
        $this->assertDatabaseCount('seasons', 1);
    }

    public function test_diary_streak_resumes_from_the_previous_seasons_final_day_after_a_gap(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        DiarySetting::query()->create(['user_id' => $user->id, 'languages' => ['en']]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $this->saveCompletedDiaryEntry($user, '2026-01-30', 1);

        app(ResolveUserSeasonCycle::class)->execute($user, CarbonImmutable::parse('2026-03-01'));
        app(StartNextSeason::class)->execute($user, CarbonImmutable::parse('2026-03-01'));
        $entry = $this->saveCompletedDiaryEntry($user, '2026-03-01', 2);

        $this->assertSame(2, $entry->streak_after);
        $this->assertDatabaseMissing('diary_entries', ['entry_date' => '2026-02-15']);
    }

    public function test_habit_streak_is_preserved_without_intermission_occurrences(): void
    {
        $user = $this->userWithPreference(SeasonRolloverPreference::Manual);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $habit = $this->createHabit($user, '2026-01-30');
        app(UpdateHabitOccurrence::class)->toggleBoolean(
            $user,
            $habit,
            CarbonImmutable::parse('2026-01-30'),
            CarbonImmutable::parse('2026-01-30'),
        );

        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-02-15'));
        app(StartNextSeason::class)->execute($user, CarbonImmutable::parse('2026-03-01'));
        app(SynchronizeHabitOccurrences::class)->execute($user, CarbonImmutable::parse('2026-03-01'));

        $this->assertSame(1, $habit->refresh()->current_streak);
        $this->assertSame(
            ['2026-01-30', '2026-03-01'],
            $habit->occurrences()->orderBy('occurrence_date')->pluck('occurrence_date')->map(fn ($date) => CarbonImmutable::parse($date)->toDateString())->all(),
        );
    }

    private function userWithPreference(SeasonRolloverPreference $preference): User
    {
        return User::factory()->create([
            'calendar_started_on' => '2026-01-01',
            'created_at' => CarbonImmutable::parse('2026-01-01'),
            'updated_at' => CarbonImmutable::parse('2026-01-01'),
            'season_rollover_preference' => $preference,
        ]);
    }

    private function saveCompletedDiaryEntry(User $user, string $date, int $revision): DiaryEntry
    {
        return app(AutosaveDiaryEntry::class)->execute(
            $user,
            CarbonImmutable::parse($date),
            [
                'content' => [['type' => 'text', 'text' => 'A complete entry written for streak verification.']],
                'language_code' => 'en',
                'mood' => 'peaceful',
                'mood_group' => 'calm',
                'client_revision' => $revision,
            ],
            CarbonImmutable::parse($date),
        );
    }
}
