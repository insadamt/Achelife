<?php

namespace Tests\Feature\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\TaskCompletionTiming;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeasonInsightsTest extends TestCase
{
    use RefreshDatabase;

    public function test_insights_derive_the_summary_and_cumulative_timeline_on_demand(): void
    {
        CarbonImmutable::setTestNow('2026-01-10 12:00:00 UTC');
        $user = User::factory()->create([
            'timezone' => 'Africa/Casablanca',
            'calendar_started_on' => '2026-01-01',
        ]);
        $season = app(SynchronizeUserSeasons::class)->execute($user);
        $season->update(['introduced_at' => now(), 'season_points' => 10]);
        $user->tasks()->create([
            'title' => 'Finish after midnight locally',
            'scheduled_date' => '2026-01-05',
            'important' => false,
            'completed_at' => CarbonImmutable::parse('2026-01-04 23:30:00 UTC'),
            'completion_timing' => TaskCompletionTiming::OnTime,
            'importance_at_completion' => false,
            'earned_sp' => 10,
            'reward_season_id' => $season->id,
        ]);

        $this->actingAs($user)
            ->getJson("/seasons/{$season->id}/insights")
            ->assertOk()
            ->assertJsonPath('summary.seasonPoints', 10)
            ->assertJsonPath('summary.breakdown.tasks', 10)
            ->assertJsonPath('elapsedDays', 10)
            ->assertJsonPath('averageSpPerDay', 1)
            ->assertJsonPath('spToday', 0)
            ->assertJsonPath('timeline.4.date', '2026-01-05')
            ->assertJsonPath('timeline.4.dailySp', 10)
            ->assertJsonPath('timeline.9.cumulativeSp', 10)
            ->assertJsonPath('previousTimeline', null);
    }

    public function test_user_cannot_load_another_users_season_insights(): void
    {
        CarbonImmutable::setTestNow('2026-01-10 12:00:00 UTC');
        $owner = User::factory()->create(['calendar_started_on' => '2026-01-01']);
        $intruder = User::factory()->create(['calendar_started_on' => '2026-01-01']);
        $season = app(SynchronizeUserSeasons::class)->execute($owner);
        $season->update(['introduced_at' => now()]);
        app(SynchronizeUserSeasons::class)->execute($intruder)->update(['introduced_at' => now()]);

        $this->actingAs($intruder)
            ->getJson("/seasons/{$season->id}/insights")
            ->assertForbidden();
    }
}
