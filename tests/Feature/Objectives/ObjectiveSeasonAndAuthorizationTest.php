<?php

namespace Tests\Feature\Objectives;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\CreatesObjectives;
use Tests\TestCase;

class ObjectiveSeasonAndAuthorizationTest extends TestCase
{
    use CreatesObjectives, RefreshDatabase;

    public function test_objectives_stay_with_their_season_and_new_seasons_start_empty(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $firstSeason = $user->seasons()->firstOrFail();
        $this->createObjective($user, $firstSeason);
        CarbonImmutable::setTestNow('2026-08-31 10:00:00');
        $secondSeason = $this->currentSeasonFor($user, '2026-08-31');
        $secondSeason->update(['introduced_at' => now()]);

        $this->assertCount(1, $firstSeason->objectives);
        $this->assertCount(0, $secondSeason->objectives);

        $this->actingAs($user)
            ->get('/seasons')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('seasons.0.objectiveCount', 1)
                ->where('seasons.1.objectiveCount', 0)
                ->where('seasons.0.objectiveCompletionMutable', false)
                ->where('seasons.1.objectiveSetupOpen', true));
    }

    public function test_existing_current_season_after_day_seven_cannot_retroactively_add_objectives(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-08');
        $season = $user->seasons()->firstOrFail();

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives", ['title' => 'Retroactive'])
            ->assertSessionHasErrors('objective');

        $this->assertDatabaseCount('objectives', 0);
    }

    public function test_cross_user_view_and_every_mutation_are_blocked(): void
    {
        $owner = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $intruder = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $ownerSeason = $owner->seasons()->firstOrFail();
        $intruderSeason = $intruder->seasons()->firstOrFail();
        $objective = $this->createObjective($owner, $ownerSeason, 'Private mission');

        $this->actingAs($intruder)
            ->post("/seasons/{$ownerSeason->id}/objectives", ['title' => 'Hijacked'])
            ->assertForbidden();
        $this->actingAs($intruder)
            ->put("/seasons/{$ownerSeason->id}/objectives/{$objective->id}", ['title' => 'Hijacked'])
            ->assertForbidden();
        $this->actingAs($intruder)
            ->delete("/seasons/{$ownerSeason->id}/objectives/{$objective->id}")
            ->assertForbidden();
        $this->actingAs($intruder)
            ->post("/seasons/{$ownerSeason->id}/objectives/{$objective->id}/toggle")
            ->assertForbidden();
        $this->actingAs($intruder)
            ->post("/seasons/{$intruderSeason->id}/objectives/{$objective->id}/toggle")
            ->assertNotFound();

        $this->actingAs($intruder)
            ->get('/seasons')
            ->assertInertia(fn (Assert $page) => $page
                ->where('seasons.0.objectiveCount', 0)
                ->missing('seasons.0.objectives.0'));

        $this->assertSame('Private mission', $objective->refresh()->title);
        $this->assertNull($objective->completed_at);
    }
}
