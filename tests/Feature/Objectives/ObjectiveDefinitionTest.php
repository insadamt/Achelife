<?php

namespace Tests\Feature\Objectives;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use LogicException;
use Tests\Concerns\CreatesObjectives;
use Tests\TestCase;

class ObjectiveDefinitionTest extends TestCase
{
    use CreatesObjectives, RefreshDatabase;

    public function test_definitions_can_be_created_renamed_and_deleted_on_days_one_through_seven(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives", ['title' => 'Day one Objective'])
            ->assertRedirect();
        $dayOneObjective = $season->objectives()->firstOrFail();

        CarbonImmutable::setTestNow('2026-08-07 10:00:00');
        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives", ['title' => 'Day seven Objective'])
            ->assertRedirect();
        $this->actingAs($user)
            ->put("/seasons/{$season->id}/objectives/{$dayOneObjective->id}", ['title' => 'Renamed on Day 7'])
            ->assertRedirect();
        $daySevenObjective = $season->objectives()->where('title', 'Day seven Objective')->firstOrFail();
        $this->actingAs($user)
            ->delete("/seasons/{$season->id}/objectives/{$daySevenObjective->id}")
            ->assertRedirect();

        $this->assertDatabaseHas('objectives', ['id' => $dayOneObjective->id, 'title' => 'Renamed on Day 7']);
        $this->assertSoftDeleted('objectives', ['id' => $daySevenObjective->id]);
    }

    public function test_definition_mutations_are_blocked_from_day_eight(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();
        $objective = $this->createObjective($user, $season);
        CarbonImmutable::setTestNow('2026-08-08 10:00:00');

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives", ['title' => 'Too late'])
            ->assertSessionHasErrors('objective');
        $this->actingAs($user)
            ->put("/seasons/{$season->id}/objectives/{$objective->id}", ['title' => 'Too late rename'])
            ->assertSessionHasErrors('objective');
        $this->actingAs($user)
            ->delete("/seasons/{$season->id}/objectives/{$objective->id}")
            ->assertSessionHasErrors('objective');

        $this->assertSame('Finish portfolio', $objective->refresh()->title);
        $this->assertDatabaseCount('objectives', 1);
    }

    public function test_backend_enforces_the_three_objective_maximum(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();

        foreach (['One', 'Two', 'Three'] as $title) {
            $this->actingAs($user)
                ->post("/seasons/{$season->id}/objectives", ['title' => $title])
                ->assertRedirect();
        }

        $this->actingAs($user)
            ->post("/seasons/{$season->id}/objectives", ['title' => 'Four'])
            ->assertSessionHasErrors('objective');

        $this->assertDatabaseCount('objectives', 3);
    }

    public function test_model_rejects_objective_ownership_that_differs_from_the_season(): void
    {
        $owner = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $intruder = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $owner->seasons()->firstOrFail();

        $this->expectException(LogicException::class);
        $season->objectives()->create([
            'user_id' => $intruder->id,
            'title' => 'Invalid ownership',
            'creation_order' => 1,
        ]);
    }

    public function test_model_rejects_incoherent_completion_state_and_reward_snapshot(): void
    {
        $user = $this->objectiveUserCreatedOn('2026-08-01', '2026-08-01');
        $season = $user->seasons()->firstOrFail();

        $this->expectException(LogicException::class);
        $season->objectives()->create([
            'user_id' => $user->id,
            'title' => 'Invalid completion',
            'creation_order' => 1,
            'completed_at' => now(),
            'earned_sp' => null,
        ]);
    }
}
