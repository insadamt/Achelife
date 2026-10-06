<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Actions\Seasons\StartNextSeason;
use App\Data\Portability\AccountRestoreRequest;
use App\Exceptions\InvalidAccountArchive;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use App\Services\Portability\ArchiveStorage;
use App\Services\Portability\PortableTableRegistry;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;
use ZipArchive;

class IntermissionArchiveTest extends TestCase
{
    use RefreshDatabase;

    /** @var list<string> */
    private array $temporaryArchives = [];

    #[DataProvider('intermissionReasons')]
    public function test_export_download_accepts_starting_the_next_season_without_a_rest_day(string $reason): void
    {
        $user = $this->startNextSeasonOnFirstEligibleDay($reason);
        $intermission = $user->seasonIntermissions()->sole();

        $this->assertSame('2026-08-31', $intermission->started_on->toDateString());
        $this->assertSame('2026-08-31', $intermission->ended_before->toDateString());
        $this->assertSame($reason, $intermission->reason->value);
        $this->actingAs($user)->get('/settings/portability/export')
            ->assertOk()
            ->assertDownload('achelife-account-2026-08-31-120000.achelife.zip');
    }

    /** @return array<string, array{string}> */
    public static function intermissionReasons(): array
    {
        return [
            'manual rollover' => ['manual_rollover'],
            'one-time hold' => ['one_time_hold'],
            'restored account' => ['restore'],
        ];
    }

    #[DataProvider('supportedArchiveFormats')]
    public function test_current_and_legacy_archives_preserve_an_empty_intermission_on_restore(int $formatVersion): void
    {
        $source = $this->startNextSeasonOnFirstEligibleDay('manual_rollover');
        $path = app(AccountArchiveExporter::class)->export($source);
        $this->temporaryArchives[] = $path;
        $this->rewriteArchiveFormat($path, $formatVersion);
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);

        $archive = app(AccountArchiveValidator::class)->validate($path);
        app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));

        $this->assertSame($formatVersion, $archive->manifest['archive_format_version']);
        $restored = $target->seasonIntermissions()->whereNotNull('ended_before')->sole();
        $this->assertSame('2026-08-31', $restored->started_on->toDateString());
        $this->assertSame('2026-08-31', $restored->ended_before->toDateString());
        $this->assertSame('manual_rollover', $restored->reason->value);
        $this->assertSame(1, $restored->afterSeason->season_number);
        $this->assertSame(2, $target->seasons()->count());

        $reexported = app(AccountArchiveExporter::class)->export($target->refresh());
        $this->temporaryArchives[] = $reexported;
        app(AccountArchiveValidator::class)->validate($reexported);
        $this->assertSame('2026-08-31', $source->seasonIntermissions()->sole()->ended_before->toDateString());
    }

    /** @return array<string, array{int}> */
    public static function supportedArchiveFormats(): array
    {
        $formats = [];

        foreach (range(1, AccountArchiveExporter::FORMAT_VERSION) as $version) {
            $formats['format '.$version] = [$version];
        }

        return $formats;
    }

    public function test_replacement_retains_a_valid_safety_archive_for_an_account_with_no_rest_day(): void
    {
        Storage::fake('local');
        $source = $this->startNextSeasonOnFirstEligibleDay('manual_rollover');
        $target = $this->startNextSeasonOnFirstEligibleDay('one_time_hold');
        $path = app(AccountArchiveExporter::class)->export($source);
        $this->temporaryArchives[] = $path;
        $archive = app(AccountArchiveValidator::class)->validate($path);

        $result = app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(false, 'RESTORE'));

        $this->assertNotNull($result->safetyArchiveName);
        $safetyPath = app(ArchiveStorage::class)->safetyPath($target, $result->safetyArchiveName);
        $safetyArchive = app(AccountArchiveValidator::class)->validate($safetyPath);
        $this->assertSame(1, $safetyArchive->manifest['table_counts']['season_intermissions']);
        $this->assertSame(2, $target->seasons()->count());
    }

    #[DataProvider('invalidIntermissions')]
    public function test_export_still_rejects_impossible_intermissions(array $changes): void
    {
        $user = $this->startNextSeasonOnFirstEligibleDay('manual_rollover');
        $user->seasonIntermissions()->update($changes);

        $this->expectException(InvalidAccountArchive::class);
        $this->expectExceptionMessage('The imported intermission timeline is impossible.');
        app(AccountArchiveExporter::class)->export($user);
    }

    /** @return array<string, array{array<string, string>}> */
    public static function invalidIntermissions(): array
    {
        return [
            'end precedes start' => [['ended_before' => '2026-08-30']],
            'start overlaps season' => [['started_on' => '2026-08-30']],
            'start skips first eligible day' => [['started_on' => '2026-09-01']],
            'unknown reason' => [['reason' => 'unknown']],
        ];
    }

    protected function tearDown(): void
    {
        foreach ($this->temporaryArchives as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    private function startNextSeasonOnFirstEligibleDay(string $reason): User
    {
        CarbonImmutable::setTestNow('2026-08-31 12:00:00');
        $user = User::factory()->create([
            'timezone' => 'UTC',
            'calendar_started_on' => '2026-08-01',
            'season_rollover_preference' => $reason === 'manual_rollover' ? 'manual' : 'automatic',
            'hold_next_season' => $reason !== 'manual_rollover',
        ]);
        $season = Season::query()->create([
            'user_id' => $user->id,
            'season_number' => 1,
            'start_date' => '2026-08-01',
            'end_date' => '2026-08-30',
            'season_points' => 0,
            'introduced_at' => now(),
        ]);

        if ($reason === 'restore') {
            $user->seasonIntermissions()->create([
                'after_season_id' => $season->id,
                'reason' => 'restore',
                'started_on' => '2026-08-31',
            ]);
        }

        app(StartNextSeason::class)->execute($user);

        return $user->refresh();
    }

    private function rewriteArchiveFormat(string $path, int $formatVersion): void
    {
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($path) === true);
        $manifest = json_decode($zip->getFromName('manifest.json'), true, 512, JSON_THROW_ON_ERROR);
        $manifest['archive_format_version'] = $formatVersion;
        $legacyTables = app(PortableTableRegistry::class)->keyedDefinitions($formatVersion);

        foreach (array_keys($manifest['table_counts']) as $table) {
            if (! isset($legacyTables[$table])) {
                $zip->deleteName('tables/'.$table.'.ndjson');
                unset($manifest['table_counts'][$table]);
            }
        }

        $manifest['files'] = array_map(fn (string $table): string => 'tables/'.$table.'.ndjson', array_keys($manifest['table_counts']));
        $manifest['module_counts'] = [];

        foreach ($legacyTables as $table => $definition) {
            $manifest['module_counts'][$definition->module] = ($manifest['module_counts'][$definition->module] ?? 0)
                + $manifest['table_counts'][$table];
        }

        $manifestJson = json_encode($manifest, JSON_THROW_ON_ERROR);
        $checksums = ['manifest.json' => hash('sha256', $manifestJson)];

        foreach ($manifest['files'] as $file) {
            $checksums[$file] = hash('sha256', $zip->getFromName($file));
        }

        $zip->addFromString('manifest.json', $manifestJson);
        $zip->addFromString('checksums.json', json_encode($checksums, JSON_THROW_ON_ERROR));
        $zip->close();
    }
}
