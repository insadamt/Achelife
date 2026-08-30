<?php

namespace Tests\Feature\Onboarding;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FirstRunOnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_fresh_onboarding_resumes_and_uses_authoritative_domain_actions(): void
    {
        CarbonImmutable::setTestNow('2026-08-26 11:00:00');
        $user = User::factory()->create([
            'onboarding_step' => 'path',
            'onboarding_completed_at' => null,
        ]);

        $this->actingAs($user)->get('/onboarding')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('onboarding/Index')
            ->where('step', 'path'));

        $this->post('/onboarding/path', ['path' => 'fresh'])->assertRedirect('/onboarding');
        $this->get('/onboarding')->assertInertia(fn (Assert $page) => $page->where('step', 'profile'));
        $this->assertDatabaseCount('seasons', 0);

        $profile = ['name' => 'Intentional User', 'timezone' => 'Africa/Casablanca', 'season_rollover_preference' => 'manual'];
        $this->post('/onboarding/profile', $profile)->assertRedirect('/onboarding');
        $this->assertDatabaseHas('seasons', ['user_id' => $user->id, 'season_number' => 1, 'start_date' => '2026-08-26 00:00:00']);

        $this->post('/onboarding/objectives', ['titles' => ['Ship v1', 'Protect health']])->assertRedirect('/onboarding');
        $this->post('/onboarding/objectives', ['titles' => ['Duplicate attempt']])->assertRedirect('/onboarding');
        $this->assertDatabaseCount('objectives', 2);

        $this->post('/onboarding/habit', ['skip' => false, 'name' => 'Walk outside'])->assertRedirect('/onboarding');
        $this->post('/onboarding/task', ['skip' => false, 'title' => 'Plan tomorrow'])->assertRedirect('/onboarding');
        $this->post('/onboarding/money', [
            'install_preset_pack' => true,
            'create_account' => true,
            'account_name' => 'Main account',
            'currency' => 'MAD',
            'initial_balance' => '250.00',
        ])->assertRedirect('/season-introduction');

        $this->assertDatabaseCount('habits', 1);
        $this->assertDatabaseCount('tasks', 1);
        $this->assertDatabaseHas('money_accounts', ['user_id' => $user->id, 'currency' => 'MAD', 'initial_balance_minor' => 25000]);
        $this->assertGreaterThan(0, $user->moneyCategories()->count());
        $this->assertNotNull($user->refresh()->onboarding_completed_at);
    }

    public function test_optional_steps_can_be_skipped_and_restore_is_explicitly_deferred(): void
    {
        $user = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        $this->actingAs($user)->post('/onboarding/path', ['path' => 'restore'])->assertSessionHasErrors('path');
        $this->post('/onboarding/path', ['path' => 'fresh']);
        $this->post('/onboarding/profile', ['name' => $user->name, 'timezone' => 'UTC', 'season_rollover_preference' => 'automatic']);
        $this->post('/onboarding/objectives', ['titles' => []]);
        $this->post('/onboarding/habit', ['skip' => true]);
        $this->post('/onboarding/task', ['skip' => true]);
        $this->post('/onboarding/money', ['install_preset_pack' => false, 'create_account' => false])->assertRedirect('/season-introduction');

        $this->assertDatabaseCount('objectives', 0);
        $this->assertDatabaseCount('habits', 0);
        $this->assertDatabaseCount('tasks', 0);
        $this->assertDatabaseCount('money_accounts', 0);
    }

    public function test_duplicate_objective_titles_use_user_facing_indexed_errors(): void
    {
        $user = User::factory()->create([
            'onboarding_step' => 'objectives',
            'onboarding_completed_at' => null,
        ]);

        $this->actingAs($user)->post('/onboarding/objectives', [
            'titles' => ['Protect health', 'Protect health', 'Ship v1'],
        ])->assertSessionHasErrors([
            'titles.0' => 'Objective titles must be unique.',
            'titles.1' => 'Objective titles must be unique.',
        ]);

        $this->assertSame('objectives', $user->refresh()->onboarding_step);
        $this->assertDatabaseCount('objectives', 0);
    }

    public function test_incomplete_onboarding_cannot_access_domain_routes(): void
    {
        $user = User::factory()->create(['onboarding_step' => 'profile', 'onboarding_completed_at' => null]);

        $this->actingAs($user)->get('/home')->assertRedirect('/onboarding');
        $this->get('/money')->assertRedirect('/onboarding');
        $this->assertDatabaseCount('seasons', 0);
    }

    public function test_an_empty_instance_cannot_access_onboarding_before_setup(): void
    {
        $this->get('/onboarding')->assertRedirect('/setup');
        $this->post('/onboarding/path', ['path' => 'fresh'])->assertRedirect('/setup');
    }
}
