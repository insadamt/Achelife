<?php

namespace Tests\Feature\Onboarding;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PhaseFourteenMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_fresh_schema_contains_onboarding_and_closeout_state(): void
    {
        $this->assertTrue(Schema::hasColumns('users', ['onboarding_step', 'onboarding_completed_at']));
        $this->assertTrue(Schema::hasColumns('seasons', ['reflection', 'recap_seen_at']));
    }

    public function test_phase_thirteen_upgrade_preserves_users_and_seasons_and_skips_first_run_for_existing_accounts(): void
    {
        $user = User::factory()->create(['name' => 'Existing User']);
        $season = app(SynchronizeUserSeasons::class)->execute($user);
        $migration = require database_path('migrations/2026_08_26_130000_add_onboarding_and_season_closeouts.php');

        $migration->down();
        $beforeUser = DB::table('users')->where('id', $user->id)->first();
        $beforeSeason = DB::table('seasons')->where('id', $season->id)->first();
        $migration->up();

        $this->assertSame($beforeUser->name, DB::table('users')->where('id', $user->id)->value('name'));
        $this->assertSame($beforeSeason->season_points, DB::table('seasons')->where('id', $season->id)->value('season_points'));
        $this->assertSame('complete', DB::table('users')->where('id', $user->id)->value('onboarding_step'));
        $this->assertNotNull(DB::table('users')->where('id', $user->id)->value('onboarding_completed_at'));
        $this->assertNull(DB::table('seasons')->where('id', $season->id)->value('reflection'));
        $this->assertNull(DB::table('seasons')->where('id', $season->id)->value('recap_seen_at'));
    }
}
