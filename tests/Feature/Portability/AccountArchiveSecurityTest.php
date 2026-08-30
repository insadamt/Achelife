<?php

namespace Tests\Feature\Portability;

use App\Exceptions\InvalidAccountArchive;
use App\Models\Season;
use App\Models\User;
use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\AccountArchiveValidator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsPortableAccounts;
use Tests\TestCase;
use ZipArchive;

class AccountArchiveSecurityTest extends TestCase
{
    use BuildsPortableAccounts;
    use RefreshDatabase;

    /** @var list<string> */
    private array $temporaryArchives = [];

    public function test_rejects_corrupted_non_zip_and_invalid_checksums(): void
    {
        $notZip = $this->temporaryPath();
        file_put_contents($notZip, 'not a zip');
        $this->expectInvalid($notZip, 'not a readable ZIP archive');

        $valid = $this->validArchive();
        $tampered = $this->mutate($valid, function (array &$entries): void {
            $entries['tables/seasons.ndjson'] .= " \n";
        });
        $this->expectInvalid($tampered, 'checksum for tables/seasons.ndjson is invalid');
    }

    public function test_rejects_zip_traversal_duplicate_and_undeclared_entries(): void
    {
        $valid = $this->validArchive();
        $traversal = $this->mutate($valid, function (array &$entries): void {
            $entries['../escape.txt'] = 'unsafe';
        });
        $this->expectInvalid($traversal, 'unsafe ZIP path');

        $undeclared = $this->mutate($valid, function (array &$entries): void {
            $entries['extra.txt'] = 'undeclared';
        });
        $this->expectInvalid($undeclared, 'missing or undeclared files');

        $duplicate = $this->storedZip([
            ['manifest.json', '{}'],
            ['manifest.json', '{}'],
        ]);
        $this->expectInvalid($duplicate, 'duplicate entry');
    }

    public function test_rejects_malformed_ndjson_and_impossible_season_timelines_even_with_valid_checksums(): void
    {
        $valid = $this->validArchive();
        $malformed = $this->mutate($valid, function (array &$entries): void {
            $entries['tables/tasks.ndjson'] = "{malformed}\n";
            $manifest = json_decode($entries['manifest.json'], true, 512, JSON_THROW_ON_ERROR);
            $manifest['table_counts']['tasks'] = 1;
            $manifest['module_counts']['tasks'] = 1;
            $entries['manifest.json'] = $this->encodeJson($manifest);
        }, resign: true);
        $this->expectInvalid($malformed, 'contains malformed JSON');

        $impossible = $this->mutate($valid, function (array &$entries): void {
            $season = json_decode(trim($entries['tables/seasons.ndjson']), true, 512, JSON_THROW_ON_ERROR);
            $season['end_date'] = '2026-08-29';
            $entries['tables/seasons.ndjson'] = $this->jsonLine($season);
        }, resign: true);
        $this->expectInvalid($impossible, 'exactly 30 calendar days');
    }

    public function test_rejects_future_newer_and_unadapted_older_formats(): void
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        $valid = $this->validArchive();
        $future = $this->mutateManifest($valid, function (array &$manifest): void {
            $manifest['created_at'] = '2026-08-15T12:06:00+00:00';
            $manifest['created_local_date'] = '2026-08-15';
        });
        $this->expectInvalid($future, 'materially in the future');

        $newer = $this->mutateManifest($valid, fn (array &$manifest) => $manifest['archive_format_version'] = 2, resign: false);
        $this->expectInvalid($newer, 'Update Achelife first');

        $older = $this->mutateManifest($valid, fn (array &$manifest) => $manifest['archive_format_version'] = 0, resign: false);
        $this->expectInvalid($older, 'no explicit compatibility adapter');
    }

    public function test_rejects_oversized_entries_and_excessive_expanded_archives(): void
    {
        $valid = $this->validArchive();
        config()->set('achelife.portability.max_entry_bytes', 10);
        $this->expectInvalid($valid, 'maximum uncompressed file size');

        config()->set('achelife.portability.max_entry_bytes', 25 * 1024 * 1024);
        config()->set('achelife.portability.max_uncompressed_bytes', 100);
        $this->expectInvalid($valid, 'safe uncompressed-size limit');
    }

    public function test_rejects_impossible_foreign_keys_and_subscription_payment_relationships(): void
    {
        $valid = $this->validArchive();
        $missingSeason = $this->mutate($valid, function (array &$entries): void {
            $manifest = json_decode($entries['manifest.json'], true, 512, JSON_THROW_ON_ERROR);
            $userId = $manifest['user']['original_id'];
            $entries['tables/season_intermissions.ndjson'] = $this->jsonLine([
                'id' => 1,
                'user_id' => $userId,
                'after_season_id' => 999,
                'reason' => 'restore',
                'started_on' => '2026-08-31',
                'ended_before' => null,
                'created_at' => '2026-08-15 12:00:00',
                'updated_at' => '2026-08-15 12:00:00',
            ]);
            $manifest['table_counts']['season_intermissions'] = 1;
            $manifest['module_counts']['seasons']++;
            $entries['manifest.json'] = $this->encodeJson($manifest);
        }, resign: true);
        $this->expectInvalid($missingSeason, 'references a missing record');

        CarbonImmutable::setTestNow('2026-09-15 12:00:00');
        $user = User::factory()->create();
        $this->buildCompletePortableGraph($user);
        $complete = app(AccountArchiveExporter::class)->export($user);
        $this->temporaryArchives[] = $complete;
        $mismatchedPayment = $this->mutate($complete, function (array &$entries): void {
            $lines = array_values(array_filter(explode("\n", trim($entries['tables/money_subscription_occurrences.ndjson']))));
            $paid = json_decode($lines[0], true, 512, JSON_THROW_ON_ERROR);
            $paid['amount_minor'] = 501;
            $lines[0] = trim($this->jsonLine($paid));
            $entries['tables/money_subscription_occurrences.ndjson'] = implode("\n", $lines)."\n";
        }, resign: true);
        $this->expectInvalid($mismatchedPayment, 'does not match its payment snapshot');
    }

    protected function tearDown(): void
    {
        foreach ($this->temporaryArchives as $path) {
            @unlink($path);
        }

        parent::tearDown();
    }

    private function validArchive(): string
    {
        CarbonImmutable::setTestNow('2026-08-15 12:00:00');
        $user = User::factory()->create(['calendar_started_on' => '2026-08-01', 'timezone' => 'UTC']);
        Season::query()->create(['user_id' => $user->id, 'season_number' => 1, 'start_date' => '2026-08-01', 'end_date' => '2026-08-30', 'season_points' => 0]);
        $path = app(AccountArchiveExporter::class)->export($user);
        $this->temporaryArchives[] = $path;

        return $path;
    }

    private function expectInvalid(string $path, string $messageFragment): void
    {
        try {
            app(AccountArchiveValidator::class)->validate($path);
            $this->fail('Expected the archive to be rejected.');
        } catch (InvalidAccountArchive $exception) {
            $this->assertStringContainsStringIgnoringCase($messageFragment, $exception->getMessage());
        }
    }

    private function mutateManifest(string $source, callable $mutation, bool $resign = true): string
    {
        return $this->mutate($source, function (array &$entries) use ($mutation): void {
            $manifest = json_decode($entries['manifest.json'], true, 512, JSON_THROW_ON_ERROR);
            $mutation($manifest);
            $entries['manifest.json'] = $this->encodeJson($manifest);
        }, $resign);
    }

    private function mutate(string $source, callable $mutation, bool $resign = false): string
    {
        $zip = new ZipArchive;
        $zip->open($source, ZipArchive::RDONLY);
        $entries = [];

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $entries[$zip->getNameIndex($index)] = $zip->getFromIndex($index);
        }

        $zip->close();
        $mutation($entries);

        if ($resign) {
            $manifest = json_decode($entries['manifest.json'], true, 512, JSON_THROW_ON_ERROR);
            $checksums = ['manifest.json' => hash('sha256', $entries['manifest.json'])];

            foreach ($manifest['files'] as $name) {
                $checksums[$name] = hash('sha256', $entries[$name]);
            }

            $entries['checksums.json'] = $this->encodeJson($checksums);
        }

        $path = $this->temporaryPath();
        $output = new ZipArchive;
        $output->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        foreach ($entries as $name => $content) {
            $output->addFromString($name, $content);
        }

        $output->close();

        return $path;
    }

    /** @param list<array{string, string}> $entries */
    private function storedZip(array $entries): string
    {
        $localData = '';
        $centralData = '';
        $offset = 0;

        foreach ($entries as [$name, $content]) {
            $crc = crc32($content);
            $size = strlen($content);
            $local = pack('VvvvvvVVVvv', 0x04034B50, 20, 0, 0, 0, 0, $crc, $size, $size, strlen($name), 0).$name.$content;
            $centralData .= pack('VvvvvvvVVVvvvvvVV', 0x02014B50, 20, 20, 0, 0, 0, 0, $crc, $size, $size, strlen($name), 0, 0, 0, 0, 0, $offset).$name;
            $localData .= $local;
            $offset += strlen($local);
        }

        $end = pack('VvvvvVVv', 0x06054B50, 0, 0, count($entries), count($entries), strlen($centralData), strlen($localData), 0);
        $path = $this->temporaryPath();
        file_put_contents($path, $localData.$centralData.$end);

        return $path;
    }

    private function temporaryPath(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'achelife-archive-test-');
        $this->temporaryArchives[] = $path;

        return $path;
    }

    /** @param array<string, mixed> $value */
    private function encodeJson(array $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
    }

    /** @param array<string, mixed> $value */
    private function jsonLine(array $value): string
    {
        return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)."\n";
    }
}
