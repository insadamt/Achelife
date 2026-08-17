<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class HomeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/home')->assertRedirect('/login');
    }

    public function test_authenticated_users_can_view_the_home_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/home')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->where('auth.user.email', $user->email));
    }
}
