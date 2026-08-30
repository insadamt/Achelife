<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Data\Portability\AccountRestoreRequest;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountArchiveTest extends TestCase
{
    use RefreshDatabase;

    public function test_export_creates_a_valid_versioned_account_archive_without_login_secrets(): void
    {
        $user = User::factory()->create([
            'name' => 'Portable Person',
            'timezone' => 'Africa/Casablanca',
            'calendar_started_on' => '2026-08-01',
            'password' => 'secret-password',
        ]);
        Season::query()->create([
            'user_id' => $user->id,
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
            'season_points' => 0,
        ]);

        $path = app(AccountArchiveExporter::class)->export($user);

        try {
            $archive = app(AccountArchiveValidator::class)->validate($path);

            $this->assertSame(1, $archive->manifest['archive_format_version']);
            $this->assertSame('Achelife', $archive->manifest['source_application']);
            $this->assertSame('Africa/Casablanca', $archive->manifest['user']['timezone']);
            $this->assertArrayNotHasKey('email', $archive->manifest['user']);
            $this->assertArrayNotHasKey('password', $archive->manifest['user']);
            $this->assertFileExists($path);
        } finally {
            @unlink($path);
        }
    }

    public function test_fresh_restore_preserves_the_internal_target_identity_and_maps_ids_without_touching_other_users(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        $source = User::factory()->create([
            'name' => 'Source Identity',
            'email' => 'source@example.com',
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-08-01',
        ]);
        $sourceSeason = Season::query()->create([
            'user_id' => $source->id,
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
            'season_points' => 0,
        ]);
        $target = User::factory()->create([
            'name' => 'Temporary Profile',
            'email' => 'target@example.com',
            'onboarding_step' => 'path',
            'onboarding_completed_at' => null,
        ]);
        $path = app(AccountArchiveExporter::class)->export($source);

        try {
            $validated = app(AccountArchiveValidator::class)->validate($path);
            $result = app(RestoreAccountArchive::class)->execute(
                $target,
                $validated,
                new AccountRestoreRequest(freshInstall: true),
            );

            $target->refresh();
            $restoredSeason = $target->seasons()->sole();
            $this->assertSame('Source Identity', $target->name);
            $this->assertSame('target@example.com', $target->email);
            $this->assertNotSame($sourceSeason->id, $restoredSeason->id);
            $this->assertSame('2026-08-01', $restoredSeason->start_date->toDateString());
            $this->assertTrue($target->hold_next_season);
            $this->assertSame('restore', $target->seasonIntermissions()->sole()->reason->value);
            $this->assertNull($result->safetyArchiveName);
            $this->assertDatabaseHas('seasons', ['id' => $sourceSeason->id, 'user_id' => $source->id]);
        } finally {
            @unlink($path);
        }
    }
}
