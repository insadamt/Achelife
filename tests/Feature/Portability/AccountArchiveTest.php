<?php

namespace Tests\Feature\Portability;

use App\Actions\Money\ArchiveMoneyMerchant;
use App\Actions\Money\ArchiveMoneyTag;
use App\Actions\Portability\RestoreAccountArchive;
use App\Data\Portability\AccountRestoreRequest;
use App\Exceptions\InvalidAccountArchive;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;

class AccountArchiveTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

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

            $this->assertSame(6, $archive->manifest['archive_format_version']);
            $this->assertSame('Achelife', $archive->manifest['source_application']);
            $this->assertSame('Africa/Casablanca', $archive->manifest['user']['timezone']);
            $this->assertArrayNotHasKey('email', $archive->manifest['user']);
            $this->assertArrayNotHasKey('password', $archive->manifest['user']);
            $this->assertFileExists($path);
        } finally {
            @unlink($path);
        }
    }

    public function test_export_rejects_an_account_with_an_inconsistent_season_sp_total(): void
    {
        $user = User::factory()->create([
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-08-01',
        ]);
        Season::query()->create([
            'user_id' => $user->id,
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
            'season_points' => 4,
        ]);

        $this->expectException(InvalidAccountArchive::class);
        $this->expectExceptionMessage('Season 1 has an invalid SP total.');

        app(AccountArchiveExporter::class)->export($user);
    }

    public function test_format_three_restores_merchants_tags_and_transaction_links(): void
    {
        CarbonImmutable::setTestNow('2026-09-12 12:00:00');
        $source = User::factory()->create([
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-09-01',
        ]);
        Season::query()->create([
            'user_id' => $source->id,
            'season_number' => 1,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'season_points' => 0,
        ]);
        $account = $this->moneyAccount($source);
        $category = $this->moneyCategory($source);
        $this->actingAs($source)->post('/money/transactions', [
            'type' => 'expense',
            'amount' => '25.00',
            'account_id' => $account->id,
            'category_id' => $category->id,
            'merchant' => 'Steam',
            'tags' => ['Games', 'Retro'],
            'date' => '2026-09-12',
        ])->assertSessionHasNoErrors();
        app(ArchiveMoneyMerchant::class)->execute($source->moneyMerchants()->sole());
        app(ArchiveMoneyTag::class)->execute($source->moneyTags()->where('name', 'Retro')->firstOrFail());
        $target = User::factory()->create([
            'onboarding_step' => 'path',
            'onboarding_completed_at' => null,
        ]);
        $path = app(AccountArchiveExporter::class)->export($source);

        try {
            $archive = app(AccountArchiveValidator::class)->validate($path);
            app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));

            $restored = $target->moneyTransactions()->with(['merchant', 'tags'])->sole();
            $this->assertSame('Steam', $restored->merchant->name);
            $this->assertNotNull($restored->merchant->archived_at);
            $this->assertSame(['Games', 'Retro'], $restored->tags->pluck('name')->sort()->values()->all());
            $this->assertNotNull($restored->tags->firstWhere('name', 'Retro')->archived_at);
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
