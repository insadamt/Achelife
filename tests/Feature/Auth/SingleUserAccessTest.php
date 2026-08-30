<?php

namespace Tests\Feature\Auth;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SingleUserAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_single_user_is_resolved_without_login(): void
    {
        $user = User::factory()->create();
        app(SynchronizeUserSeasons::class)->execute($user)->update(['introduced_at' => now()]);

        $this->get('/home')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Home')
                ->where('auth.user.id', $user->id)
                ->where('auth.user.name', $user->name));
    }

    public function test_login_registration_and_logout_endpoints_do_not_exist(): void
    {
        $this->get('/login')->assertNotFound();
        $this->post('/login')->assertNotFound();
        $this->get('/register')->assertNotFound();
        $this->post('/register')->assertNotFound();
        $this->post('/logout')->assertNotFound();
    }

    public function test_an_uninitialized_instance_redirects_to_setup(): void
    {
        $this->get('/home')->assertRedirect('/setup');
    }

    public function test_unauthenticated_access_fails_safely_when_multiple_profiles_exist(): void
    {
        User::factory()->count(2)->create();

        $this->get('/home')->assertConflict();
    }
}
