<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SingleUserSetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_setup_screen_can_be_rendered_on_an_empty_instance(): void
    {
        $this->get('/setup')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('setup/Index'));
    }

    public function test_setup_creates_the_internal_profile_without_credentials(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:30:00');

        $this->post('/setup', ['name' => 'Test User'])->assertRedirect('/onboarding');

        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'owner@achelife.invalid',
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-08-18 00:00:00',
            'onboarding_step' => 'path',
            'onboarding_completed_at' => null,
        ]);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('seasons', 0);
        $this->assertNotEmpty(User::query()->sole()->password);
    }

    public function test_setup_anchors_the_calendar_in_the_browser_timezone(): void
    {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-08-18 23:30:00', 'UTC'));

        $this->post('/setup', [
            'name' => 'Local User',
            'timezone' => 'Asia/Dubai',
        ])->assertRedirect('/onboarding');

        $this->assertDatabaseHas('users', [
            'timezone' => 'Asia/Dubai',
            'calendar_started_on' => '2026-08-19 00:00:00',
        ]);
    }

    public function test_setup_cannot_create_a_second_profile(): void
    {
        User::factory()->create();

        $this->get('/setup')->assertRedirect('/home');
        $this->post('/setup', ['name' => 'Second User'])->assertRedirect('/home');
        $this->assertDatabaseCount('users', 1);
    }
}
