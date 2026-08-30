<?php

namespace Tests\Feature\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeasonIntroductionTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_season_introduction_is_shown_until_acknowledged(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $user = User::factory()->create();
        $season = app(SynchronizeUserSeasons::class)->execute($user);

        $this->actingAs($user)
            ->get('/season-introduction')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('seasons/Introduction')
                ->where('season.number', 1)
                ->where('season.day', 1)
                ->where('previousSeason', null));

        $this->post("/seasons/{$season->id}/introduction")
            ->assertRedirect('/seasons');

        $this->assertNotNull($season->refresh()->introduced_at);
        $this->get('/season-introduction')->assertRedirect('/seasons');
    }

    public function test_latest_closeout_is_required_before_the_actual_current_season_is_introduced_after_multiple_seasons_pass(): void
    {
        CarbonImmutable::setTestNow('2026-04-11 10:00:00');
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse('2026-01-01'),
            'updated_at' => CarbonImmutable::parse('2026-01-01'),
        ]);

        $response = $this->actingAs($user)->get('/season-introduction');
        $thirdSeason = $user->seasons()->where('season_number', 3)->firstOrFail();
        $response->assertRedirect("/seasons/{$thirdSeason->id}/closeout");
        $this->actingAs($user)->put("/seasons/{$thirdSeason->id}/closeout", ['reflection' => null])
            ->assertRedirect('/season-introduction');

        $this->get('/season-introduction')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('seasons/Introduction')
                ->where('season.number', 4)
                ->where('previousSeason.number', 3));

        $this->assertSame(1, $user->seasons()->whereNull('introduced_at')->count());
        $this->assertSame(4, $user->seasons()->whereNull('introduced_at')->value('season_number'));
    }

    public function test_user_cannot_acknowledge_another_users_season(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:00:00');
        $owner = User::factory()->create();
        $intruder = User::factory()->create();
        $season = app(SynchronizeUserSeasons::class)->execute($owner);

        $this->actingAs($intruder)
            ->post("/seasons/{$season->id}/introduction")
            ->assertForbidden();

        $this->assertNull($season->refresh()->introduced_at);
    }
}
