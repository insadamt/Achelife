<?php

namespace Tests\Feature\Portability;

use App\Actions\Portability\RestoreAccountArchive;
use App\Data\Portability\AccountRestoreRequest;
use App\Enums\MoneyTransactionType;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use App\Services\Portability\PortableTableRegistry;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\CreatesMoney;
use Tests\TestCase;
use ZipArchive;

class TransactionPersonArchiveTest extends TestCase
{
    use CreatesMoney, RefreshDatabase;

    #[DataProvider('archiveFormats')]
    public function test_person_links_round_trip_and_older_archives_restore_without_links(int $format): void
    {
        CarbonImmutable::setTestNow('2026-09-12 12:00:00');
        $source = User::factory()->create(['timezone' => 'UTC', 'calendar_started_on' => '2026-09-01']);
        Season::query()->create(['user_id' => $source->id, 'season_number' => 1, 'start_date' => '2026-09-01',
            'end_date' => '2026-09-30', 'season_points' => 0]);
        $account = $this->moneyAccount($source);
        $category = $this->moneyCategory($source);
        $person = $source->people()->create(['name' => 'Sara', 'archived_at' => now()]);
        $this->moneyTransaction($source, MoneyTransactionType::Expense, $account, 1250, category: $category, date: '2026-09-12')
            ->update(['person_id' => $person->id]);
        $path = app(AccountArchiveExporter::class)->export($source);
        $target = User::factory()->create(['onboarding_step' => 'path', 'onboarding_completed_at' => null]);
        try {
            if ($format < AccountArchiveExporter::FORMAT_VERSION) {
                $this->rewriteAsLegacyFormat($path, $format);
            }
            $archive = app(AccountArchiveValidator::class)->validate($path);
            app(RestoreAccountArchive::class)->execute($target, $archive, new AccountRestoreRequest(freshInstall: true));
            $restored = $target->moneyTransactions()->sole();
            $this->assertSame(1250, $restored->amount_minor);
            if ($format >= 12) {
                $this->assertSame('Sara', $restored->person->name);
                $this->assertNotSame($person->id, $restored->person_id);
                $this->assertSame($target->id, $restored->person->user_id);
                $this->assertNotNull($restored->person->archived_at);
            } else {
                $this->assertNull($restored->person_id);
                $this->assertSame('Sara', $target->people()->sole()->name);
            }
        } finally {
            @unlink($path);
        }
    }

    public static function archiveFormats(): array
    {
        return array_map(fn (int $version): array => [$version], range(1, AccountArchiveExporter::FORMAT_VERSION));
    }

    private function rewriteAsLegacyFormat(string $path, int $format): void
    {
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($path) === true);
        $manifest = json_decode($zip->getFromName('manifest.json'), true, 512, JSON_THROW_ON_ERROR);
        $manifest['archive_format_version'] = $format;
        $definitions = app(PortableTableRegistry::class)->keyedDefinitions($format);
        $files = [];
        $manifest['module_counts'] = [];
        foreach (array_keys($manifest['table_counts']) as $table) {
            $file = 'tables/'.$table.'.ndjson';
            if (! isset($definitions[$table])) {
                $zip->deleteName($file);
                unset($manifest['table_counts'][$table]);

                continue;
            }
            $definition = $definitions[$table];
            $manifest['module_counts'][$definition->module] = ($manifest['module_counts'][$definition->module] ?? 0) + $manifest['table_counts'][$table];
            $rows = array_filter(explode("\n", $zip->getFromName($file)));
            $files[$file] = implode("\n", array_map(function (string $line) use ($definition): string {
                $row = json_decode($line, true, 512, JSON_THROW_ON_ERROR);

                return json_encode(array_intersect_key($row, array_flip($definition->columns)), JSON_THROW_ON_ERROR);
            }, $rows));
            if ($files[$file] !== '') {
                $files[$file] .= "\n";
            }
        }
        $manifest['files'] = array_keys($files);
        $manifestJson = json_encode($manifest, JSON_THROW_ON_ERROR);
        $checksums = ['manifest.json' => hash('sha256', $manifestJson)];
        foreach ($files as $file => $contents) {
            $zip->addFromString($file, $contents);
            $checksums[$file] = hash('sha256', $contents);
        }
        $zip->addFromString('manifest.json', $manifestJson);
        $zip->addFromString('checksums.json', json_encode($checksums, JSON_THROW_ON_ERROR));
        $zip->close();
    }
}
