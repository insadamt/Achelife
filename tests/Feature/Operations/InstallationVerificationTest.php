<?php

namespace Tests\Feature\Operations;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class InstallationVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_fresh_database_is_ready_for_passwordless_setup(): void
    {
        $exitCode = Artisan::call('achelife:verify', ['--json' => true]);
        $result = json_decode(trim(Artisan::output()), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame(0, $exitCode);
        $this->assertTrue($result['ready']);
        $this->assertSame('ready_for_setup', $result['single_user_state']);
        $this->assertSame([], $result['pending_migrations']);
    }

    public function test_one_existing_profile_is_single_user_ready(): void
    {
        User::factory()->create();

        $exitCode = Artisan::call('achelife:verify', ['--json' => true]);
        $result = json_decode(trim(Artisan::output()), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame(0, $exitCode);
        $this->assertTrue($result['ready']);
        $this->assertSame('ready', $result['single_user_state']);
        $this->assertSame(1, $result['profile_count']);
    }

    public function test_multiple_profiles_fail_operational_verification(): void
    {
        User::factory()->count(2)->create();

        $exitCode = Artisan::call('achelife:verify', ['--json' => true]);
        $result = json_decode(trim(Artisan::output()), true, flags: JSON_THROW_ON_ERROR);

        $this->assertSame(1, $exitCode);
        $this->assertFalse($result['ready']);
        $this->assertSame('conflict', $result['single_user_state']);
    }
}
