<?php

namespace Tests\Feature\Rank;

use App\Actions\Constitution\CreateLaw;
use App\Actions\Objectives\CreateObjective;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Enums\LawSeverity;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RankProgressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
    }

    public function test_task_completion_promotes_the_live_rank_from_refreshed_season_sp(): void
    {
        $user = $this->activeUser();
        $season = $user->seasons()->firstOrFail();
        $season->update(['season_points' => 1196]);
        $task = $user->tasks()->create([
            'title' => 'Cross the threshold',
            'scheduled_date' => '2026-08-18',
            'important' => false,
        ]);

        $this->actingAs($user)->from('/home')->post("/tasks/{$task->id}/completion")->assertRedirect('/home');

        $this->assertSame(1200, $season->refresh()->season_points);
        $this->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('currentSeason.rank.key', 'diamond_i')
            ->where('currentSeason.rank.displayName', 'DIAMOND I'));
    }

    public function test_constitution_penalty_demotes_the_live_rank(): void
    {
        $user = $this->activeUser();
        $season = $user->seasons()->firstOrFail();
        $season->update(['season_points' => 1220]);
        $law = app(CreateLaw::class)->execute($user, 'Protect focus', LawSeverity::Major);

        $this->actingAs($user)->from('/home')->post("/constitution/laws/{$law->id}/violations", [
            'date' => '2026-08-18',
        ])->assertRedirect('/home');

        $this->assertSame(1170, $season->refresh()->season_points);
        $this->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('currentSeason.rank.key', 'platinum_iii')
            ->where('currentSeason.rank.displayName', 'PLATINUM III'));
    }

    public function test_objective_uncompletion_can_demote_the_live_rank(): void
    {
        $user = $this->activeUser();
        $season = $user->seasons()->firstOrFail();
        $objective = app(CreateObjective::class)->execute(
            $user,
            $season,
            'Complete the Season mission',
            CarbonImmutable::parse('2026-08-05'),
        );
        $season->update(['season_points' => 900]);

        $this->actingAs($user)->from('/home')->post("/seasons/{$season->id}/objectives/{$objective->id}/toggle")->assertRedirect('/home');
        $this->get('/home')->assertInertia(fn (Assert $page) => $page->where('currentSeason.rank.key', 'diamond_i'));

        $this->from('/home')->post("/seasons/{$season->id}/objectives/{$objective->id}/toggle")->assertRedirect('/home');
        $this->assertSame(900, $season->refresh()->season_points);
        $this->get('/home')->assertInertia(fn (Assert $page) => $page->where('currentSeason.rank.key', 'platinum_i'));
    }

    public function test_rank_responses_are_scoped_to_the_authenticated_user(): void
    {
        $owner = $this->activeUser();
        $other = $this->activeUser('2026-08-02');
        $owner->seasons()->firstOrFail()->update(['season_points' => 100]);
        $other->seasons()->firstOrFail()->update(['season_points' => 1550]);

        $this->actingAs($owner)->get('/home')->assertInertia(fn (Assert $page) => $page
            ->where('currentSeason.rank.key', 'bronze_ii')
            ->where('currentSeason.seasonPoints', 100));
    }

    private function activeUser(string $createdOn = '2026-08-01'): User
    {
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse($createdOn),
            'updated_at' => CarbonImmutable::parse($createdOn),
        ]);
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::today())->update(['introduced_at' => now()]);

        return $user;
    }
}
