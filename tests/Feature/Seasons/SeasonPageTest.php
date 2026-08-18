<?php

namespace Tests\Feature\Seasons;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SeasonPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_seasons(): void
    {
        $this->get('/seasons')->assertRedirect('/login');
    }

    public function test_page_renders_history_current_season_and_two_locked_placeholders(): void
    {
        CarbonImmutable::setTestNow('2026-01-31 12:00:00');
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse('2026-01-01'),
            'updated_at' => CarbonImmutable::parse('2026-01-01'),
        ]);
        $currentSeason = app(SynchronizeUserSeasons::class)->execute($user);
        $currentSeason->update(['introduced_at' => now()]);

        $this->actingAs($user)
            ->get('/seasons')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('seasons/Index')
                ->where('currentSeasonNumber', 2)
                ->has('seasons', 4)
                ->where('seasons.0.state', 'completed')
                ->where('seasons.1.state', 'current')
                ->where('seasons.1.day', 1)
                ->where('seasons.2.state', 'locked')
                ->where('seasons.3.state', 'locked'));

        $this->assertDatabaseCount('seasons', 2);
    }
}
