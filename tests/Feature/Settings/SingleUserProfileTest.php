<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SingleUserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_display_name_can_be_changed_without_credentials(): void
    {
        $user = User::factory()->create(['email' => 'internal@example.com']);

        $this->put('/settings/account/profile', [
            'name' => 'Updated Name',
            'email' => 'ignored@example.com',
        ])->assertRedirect();

        $user->refresh();
        $this->assertSame('Updated Name', $user->name);
        $this->assertSame('internal@example.com', $user->email);
    }

    public function test_password_change_endpoint_is_not_exposed(): void
    {
        User::factory()->create();

        $this->put('/settings/account/password', [])->assertNotFound();
    }
}
