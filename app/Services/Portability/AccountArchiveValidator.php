<?php

namespace App\Services\Portability;

use App\Data\Portability\ValidatedArchive;
use App\Exceptions\InvalidAccountArchive;
use Carbon\CarbonImmutable;
use DateTimeZone;
use Throwable;
use ZipArchive;

class AccountArchiveValidator
{
    public function __construct(
        private readonly PortableTableRegistry $tableRegistry,
        private readonly ArchiveReader $reader,
        private readonly ArchiveFormatAdapterRegistry $formatAdapters,
        private readonly ArchiveSemanticValidator $semanticValidator,
    ) {}

    public function validate(string $archivePath): ValidatedArchive
    {
        $this->validateCompressedSize($archivePath);
        $entryNames = $this->inspectZip($archivePath);
        $manifest = $this->reader->readJson($archivePath, 'manifest.json');
        $this->validateManifest($manifest);
        $this->validateDeclaredFiles($entryNames, $manifest);
        $this->validateChecksums($archivePath, $manifest);
        $this->semanticValidator->validate($archivePath, $manifest);

        return new ValidatedArchive($archivePath, $manifest);
    }

    private function validateCompressedSize(string $archivePath): void
    {
        $size = filesize($archivePath);

        if ($size === false || $size < 1) {
            throw new InvalidAccountArchive('The uploaded archive is empty or unreadable.');
        }

        if ($size > (int) config('achelife.portability.max_archive_bytes')) {
            throw new InvalidAccountArchive('The uploaded archive is too large.');
        }
    }

    /** @return list<string> */
    private function inspectZip(string $archivePath): array
    {
        $zip = new ZipArchive;

        if ($zip->open($archivePath, ZipArchive::RDONLY) !== true) {
            throw new InvalidAccountArchive('The uploaded file is not a readable ZIP archive.');
        }

        $names = [];
        $seen = [];
        $uncompressedBytes = 0;

        try {
            if ($zip->numFiles > (int) config('achelife.portability.max_entries')) {
                throw new InvalidAccountArchive('The archive contains too many files.');
            }

            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);

                if (! is_array($stat) || ! isset($stat['name'], $stat['size'])) {
                    throw new InvalidAccountArchive('The ZIP directory is malformed.');
                }

                $name = (string) $stat['name'];
                $this->validateEntryName($name);

                if (isset($seen[$name])) {
                    throw new InvalidAccountArchive("The archive contains a duplicate entry: {$name}.");
                }

                if ((int) $stat['size'] > (int) config('achelife.portability.max_entry_bytes')) {
                    throw new InvalidAccountArchive("{$name} exceeds the maximum uncompressed file size.");
                }

                $uncompressedBytes += (int) $stat['size'];
                $this->rejectSymlink($zip, $index, $name);
                $seen[$name] = true;
                $names[] = $name;
            }
        } finally {
            $zip->close();
        }

        if ($uncompressedBytes > (int) config('achelife.portability.max_uncompressed_bytes')) {
            throw new InvalidAccountArchive('The archive expands beyond the safe uncompressed-size limit.');
        }

        return $names;
    }

    private function validateEntryName(string $name): void
    {
        $unsafe = $name === ''
            || str_contains($name, "\0")
            || str_contains($name, '\\')
            || str_starts_with($name, '/')
            || str_ends_with($name, '/')
            || preg_match('#(^|/)\.\.?(/|$)#', $name) === 1;

        if ($unsafe) {
            throw new InvalidAccountArchive("The archive contains an unsafe ZIP path: {$name}.");
        }
    }

    private function rejectSymlink(ZipArchive $zip, int $index, string $name): void
    {
        $operatingSystem = 0;
        $attributes = 0;

        if ($zip->getExternalAttributesIndex($index, $operatingSystem, $attributes)
            && (($attributes >> 16) & 0170000) === 0120000) {
            throw new InvalidAccountArchive("The archive contains a symbolic link: {$name}.");
        }
    }

    /** @param array<string, mixed> $manifest */
    private function validateManifest(array $manifest): void
    {
        $requiredKeys = ['archive_format_version', 'source_application', 'source_application_version', 'created_at', 'created_local_date', 'user', 'latest_season', 'table_counts', 'module_counts', 'files'];

        if (array_diff($requiredKeys, array_keys($manifest)) !== []) {
            throw new InvalidAccountArchive('manifest.json is missing required metadata.');
        }

        if (! is_int($manifest['archive_format_version'])) {
            throw new InvalidAccountArchive('The archive format version is invalid.');
        }

        $this->formatAdapters->requireSupported($manifest['archive_format_version']);

        if ($manifest['source_application'] !== 'Achelife' || ! is_string($manifest['source_application_version'])) {
            throw new InvalidAccountArchive('The archive source application is invalid.');
        }

        $createdAt = $this->createdAt($manifest['created_at']);
        $futureLimit = CarbonImmutable::now('UTC')->addMinutes((int) config('achelife.portability.future_tolerance_minutes'));

        if ($createdAt->isAfter($futureLimit)) {
            throw new InvalidAccountArchive('The backup was created materially in the future.');
        }

        $user = $manifest['user'];

        if (! is_array($user)
            || filter_var($user['original_id'] ?? null, FILTER_VALIDATE_INT) === false
            || ! is_string($user['timezone'] ?? null)
            || ! in_array($user['timezone'], [...DateTimeZone::listIdentifiers(), 'UTC'], true)
            || ! in_array($user['season_rollover_preference'] ?? null, ['automatic', 'manual'], true)
            || ! is_bool($user['hold_next_season'] ?? null)
            || ! is_int($user['money_preset_pack_version'] ?? null)
            || $user['money_preset_pack_version'] < 0) {
            throw new InvalidAccountArchive('The saved account calendar metadata is invalid.');
        }

        if ($createdAt->setTimezone($user['timezone'])->toDateString() !== $manifest['created_local_date']) {
            throw new InvalidAccountArchive('The backup local date does not match its timezone.');
        }

        if (! is_array($manifest['table_counts']) || array_is_list($manifest['table_counts'])
            || ! is_array($manifest['module_counts']) || array_is_list($manifest['module_counts'])
            || ! is_array($manifest['files']) || ! array_is_list($manifest['files'])) {
            throw new InvalidAccountArchive('The archive declarations are malformed.');
        }

        $expectedTableNames = array_map(fn ($definition): string => $definition->name, $this->tableRegistry->definitions());
        $declaredTableNames = array_keys($manifest['table_counts']);
        sort($expectedTableNames);
        sort($declaredTableNames);

        if ($expectedTableNames !== $declaredTableNames
            || collect($manifest['table_counts'])->contains(fn ($count): bool => ! is_int($count) || $count < 0)) {
            throw new InvalidAccountArchive('The archive table counts are incomplete or invalid.');
        }

        $expectedModuleCounts = [];

        foreach ($this->tableRegistry->definitions() as $definition) {
            $expectedModuleCounts[$definition->module] = ($expectedModuleCounts[$definition->module] ?? 0) + $manifest['table_counts'][$definition->name];
        }

        if ($manifest['module_counts'] !== $expectedModuleCounts) {
            throw new InvalidAccountArchive('The archive module counts are inconsistent.');
        }
    }

    /** @param list<string> $entryNames
     * @param  array<string, mixed>  $manifest
     */
    private function validateDeclaredFiles(array $entryNames, array $manifest): void
    {
        $expectedTableFiles = array_map(fn ($definition): string => $definition->path(), $this->tableRegistry->definitions());
        $declaredFiles = $manifest['files'];

        sort($expectedTableFiles);
        sort($declaredFiles);

        if ($declaredFiles !== $expectedTableFiles) {
            throw new InvalidAccountArchive('The archive table-file declaration is incomplete or unsupported.');
        }

        $expectedEntries = ['checksums.json', 'manifest.json', ...$expectedTableFiles];
        sort($expectedEntries);
        sort($entryNames);

        if ($entryNames !== $expectedEntries) {
            throw new InvalidAccountArchive('The archive contains missing or undeclared files.');
        }
    }

    /** @param array<string, mixed> $manifest */
    private function validateChecksums(string $archivePath, array $manifest): void
    {
        $checksums = $this->reader->readJson($archivePath, 'checksums.json');
        $expectedNames = ['manifest.json', ...$manifest['files']];
        $checksumNames = array_keys($checksums);
        sort($expectedNames);
        sort($checksumNames);

        if ($checksumNames !== $expectedNames) {
            throw new InvalidAccountArchive('checksums.json does not declare every archive data file exactly once.');
        }

        foreach ($checksums as $entryName => $expectedHash) {
            if (! is_string($expectedHash) || preg_match('/^[a-f0-9]{64}$/', $expectedHash) !== 1
                || ! hash_equals($expectedHash, $this->reader->hash($archivePath, $entryName))) {
                throw new InvalidAccountArchive("The checksum for {$entryName} is invalid.");
            }
        }
    }

    private function createdAt(mixed $value): CarbonImmutable
    {
        if (! is_string($value)) {
            throw new InvalidAccountArchive('The backup creation time is invalid.');
        }

        try {
            return CarbonImmutable::parse($value)->utc();
        } catch (Throwable) {
            throw new InvalidAccountArchive('The backup creation time is invalid.');
        }
    }
}
