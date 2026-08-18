<?php

namespace Tests\Feature;

use App\Actions\Seasons\SynchronizeUserSeasons;
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
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);

        $this->actingAs($user)
            ->get('/home')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->where('auth.user.email', $user->email));
    }

    public function test_entering_the_application_initializes_an_existing_account_without_seasons(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/home')
            ->assertRedirect('/season-introduction');

        $this->assertDatabaseCount('seasons', 1);
        $this->assertDatabaseHas('seasons', [
            'user_id' => $user->id,
            'season_number' => 1,
        ]);
    }
}
