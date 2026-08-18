<?php

namespace Tests\Feature\Auth;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/Register'));
    }

    public function test_new_users_can_register(): void
    {
        CarbonImmutable::setTestNow('2026-08-18 10:30:00');

        $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/season-introduction');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);
        $this->assertDatabaseHas('seasons', [
            'season_number' => 1,
            'start_date' => '2026-08-18 00:00:00',
            'end_date' => '2026-09-16 00:00:00',
            'season_points' => 0,
            'rank' => null,
            'introduced_at' => null,
        ]);
    }
}
