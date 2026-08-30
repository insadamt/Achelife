<?php

namespace Tests\Feature\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\HabitDifficulty;
use App\Enums\HabitOccurrenceKind;
use App\Enums\HabitOccurrenceState;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use App\Enums\SeasonRolloverPreference;
use App\Enums\TaskCompletionTiming;
use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeasonCloseoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_closeout_derives_module_totals_and_outcomes_from_authoritative_records(): void
    {
        $user = User::factory()->create(['calendar_started_on' => '2026-01-01']);
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $this->seedCloseoutActivity($user, $season);
        $season->update(['season_points' => 118, 'rank' => 'bronze_ii', 'finalized_at' => now(), 'introduced_at' => now()]);

        $this->actingAs($user)->get("/seasons/{$season->id}/closeout")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('seasons/Closeout')
            ->where('closeout.seasonPoints', 118)
            ->where('closeout.rank.displayName', 'BRONZE II')
            ->where('closeout.breakdown.tasks', 8)
            ->where('closeout.breakdown.habits', 4)
            ->where('closeout.breakdown.diary', 6)
            ->where('closeout.breakdown.objectives', 150)
            ->where('closeout.breakdown.constitution', -50)
            ->where('closeout.metrics.tasksResolved', 1)
            ->where('closeout.metrics.tasksTotal', 2)
            ->where('closeout.metrics.habitAdherencePercent', 50)
            ->where('closeout.metrics.diaryDays', 1)
            ->where('closeout.metrics.objectivesCompleted', 1)
            ->where('closeout.metrics.constitutionViolations', 1));
    }

    public function test_automatic_rollover_requires_closeout_before_the_next_introduction(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $user = User::factory()->create(['calendar_started_on' => '2026-01-01']);
        $first = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $first->update(['introduced_at' => now(), 'season_points' => -20]);

        $this->actingAs($user)->get('/home')->assertRedirect("/seasons/{$first->id}/closeout");
        $this->put("/seasons/{$first->id}/closeout", ['reflection' => 'Reset with less friction.'])
            ->assertRedirect('/season-introduction');

        $this->assertSame('unranked', $first->refresh()->rank);
        $this->assertSame('Reset with less friction.', $first->reflection);
        $this->assertNotNull($first->recap_seen_at);
    }

    public function test_manual_intermission_keeps_the_closeout_on_the_dashboard(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $user = User::factory()->create([
            'calendar_started_on' => '2026-01-01',
            'season_rollover_preference' => SeasonRolloverPreference::Manual,
        ]);
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $season->update(['introduced_at' => now()]);

        $this->actingAs($user)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Intermission')
            ->where('closeout.seasonNumber', 1)
            ->where('closeout.seasonPoints', 0)
            ->where('closeout.rank.displayName', 'BRONZE I')
            ->where('closeout.metrics.tasksTotal', 0)
            ->where('closeout.metrics.habitsRequired', 0)
            ->where('closeout.metrics.diaryDays', 0));
    }

    public function test_one_time_hold_keeps_the_closeout_on_the_intermission_dashboard(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $user = User::factory()->create([
            'calendar_started_on' => '2026-01-01',
            'season_rollover_preference' => SeasonRolloverPreference::Automatic,
            'hold_next_season' => true,
        ]);
        $season = app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse('2026-01-30'));
        $season->update(['introduced_at' => now(), 'season_points' => 2100]);

        $this->actingAs($user)->get('/home')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Intermission')
            ->where('cycle.intermission.reason', 'one_time_hold')
            ->where('closeout.rank.displayName', 'LEGEND')
            ->where('closeout.seasonPoints', 2100));
    }

    public function test_legend_and_previous_season_comparison_are_presented(): void
    {
        $user = User::factory()->create(['calendar_started_on' => '2026-01-01']);
        $first = $user->seasons()->create([
            'season_number' => 1,
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-30',
            'season_points' => 500,
            'rank' => 'silver_iii',
            'introduced_at' => now(),
            'finalized_at' => now(),
            'recap_seen_at' => now(),
        ]);
        $second = $user->seasons()->create([
            'season_number' => 2,
            'start_date' => '2026-02-01',
            'end_date' => '2026-03-02',
            'season_points' => 2200,
            'rank' => 'legend',
            'introduced_at' => now(),
            'finalized_at' => now(),
        ]);

        $this->actingAs($user)->get("/seasons/{$second->id}/closeout")->assertInertia(fn (Assert $page) => $page
            ->where('closeout.rank.displayName', 'LEGEND')
            ->where('closeout.previous.seasonId', $first->id)
            ->where('closeout.previous.seasonPoints', 500));
    }

    public function test_user_cannot_view_or_update_another_users_closeout(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $season = $owner->seasons()->create([
            'season_number' => 1,
            'start_date' => '2026-01-01',
            'end_date' => '2026-01-30',
            'season_points' => 0,
            'rank' => 'bronze_i',
            'finalized_at' => now(),
        ]);

        $this->actingAs($intruder)->get("/seasons/{$season->id}/closeout")->assertForbidden();
        $this->put("/seasons/{$season->id}/closeout", ['reflection' => 'No'])->assertForbidden();
    }

    private function seedCloseoutActivity(User $user, Season $season): void
    {
        $user->tasks()->create(['title' => 'Done', 'scheduled_date' => '2026-01-10', 'important' => true, 'completed_at' => now(), 'completion_timing' => TaskCompletionTiming::OnTime, 'importance_at_completion' => true, 'earned_sp' => 8, 'reward_season_id' => $season->id]);
        $user->tasks()->create(['title' => 'Open', 'scheduled_date' => '2026-01-11', 'important' => false]);
        $habit = $user->habits()->create(['name' => 'Read', 'type' => HabitType::Boolean, 'starts_on' => '2026-01-01']);

        foreach ([[HabitOccurrenceState::Completed, 4], [HabitOccurrenceState::Missed, 0]] as $index => [$state, $reward]) {
            $habit->occurrences()->create(['user_id' => $user->id, 'season_id' => $season->id, 'occurrence_date' => "2026-01-1{$index}", 'occurrence_kind' => HabitOccurrenceKind::Required, 'state' => $state, 'difficulty_snapshot' => HabitDifficulty::Normal, 'schedule_type_snapshot' => HabitScheduleType::EveryDay, 'base_reward' => 4, 'streak_after' => $reward > 0 ? 1 : 0, 'reward_multiplier' => $reward > 0 ? 1 : 0, 'earned_sp' => $reward]);
        }

        $user->diaryEntries()->create(['season_id' => $season->id, 'entry_date' => '2026-01-12', 'content' => [], 'plain_text' => 'A complete diary record', 'valid_character_count' => 23, 'language_code' => 'en', 'language_name_snapshot' => 'English', 'mood' => 'peaceful', 'mood_group' => 'calm', 'is_completed' => true, 'streak_after' => 10, 'reward_multiplier' => 1.5, 'earned_sp' => 6]);
        $season->objectives()->create(['user_id' => $user->id, 'title' => 'Objective', 'creation_order' => 1, 'completed_at' => now(), 'earned_sp' => 150]);
        $season->objectives()->create(['user_id' => $user->id, 'title' => 'Objective two', 'creation_order' => 2]);
        $law = $user->laws()->create(['name' => 'No avoidance', 'severity' => 'major', 'created_on' => '2026-01-01']);
        $law->violations()->create(['user_id' => $user->id, 'season_id' => $season->id, 'violation_date' => '2026-01-13', 'severity_snapshot' => 'major', 'base_penalty_snapshot' => -50, 'sequence_number' => 1, 'penalty_sp' => -50]);
    }
}
