<?php

namespace App\Services\Portability;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use ZipArchive;

class AccountArchiveExporter
{
    public const FORMAT_VERSION = 1;

    public function __construct(private readonly PortableTableRegistry $tableRegistry) {}

    public function export(User $user): string
    {
        $workingDirectory = $this->createWorkingDirectory();

        try {
            $snapshot = $this->writeSnapshot($user, $workingDirectory);
            $manifestPath = $workingDirectory.'/manifest.json';
            $this->writeJson($manifestPath, $snapshot['manifest']);
            $checksums = ['manifest.json' => hash_file('sha256', $manifestPath)];

            foreach ($snapshot['tablePaths'] as $archivePath => $localPath) {
                $checksums[$archivePath] = hash_file('sha256', $localPath);
            }

            $checksumsPath = $workingDirectory.'/checksums.json';
            $this->writeJson($checksumsPath, $checksums);

            return $this->createZip($snapshot['tablePaths'], $manifestPath, $checksumsPath);
        } finally {
            $this->removeWorkingDirectory($workingDirectory);
        }
    }

    /** @return array{manifest: array<string, mixed>, tablePaths: array<string, string>} */
    private function writeSnapshot(User $user, string $workingDirectory): array
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        }

        return DB::transaction(function () use ($user, $workingDirectory): array {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
            }

            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->id);
            $ownedIds = [];
            $tableCounts = [];
            $moduleCounts = [];
            $tablePaths = [];

            foreach ($this->tableRegistry->definitions() as $definition) {
                $localPath = $workingDirectory.'/'.$definition->name.'.ndjson';
                $handle = fopen($localPath, 'wb');

                if ($handle === false) {
                    throw new RuntimeException("Unable to create {$definition->name} export data.");
                }

                $count = 0;

                try {
                    $orderColumn = $definition->identityColumn ?? 'user_id';

                    foreach ($this->tableRegistry->queryForUser($definition, $lockedUser->id, $ownedIds)->orderBy($orderColumn)->cursor() as $row) {
                        $attributes = (array) $row;
                        $attributes = $this->normalizeDateOnlyValues($attributes);
                        $this->writeNdjsonRow($handle, $attributes);
                        $count++;

                        if ($definition->identityColumn !== null) {
                            $ownedIds[$definition->name][] = (int) $attributes[$definition->identityColumn];
                        }
                    }
                } finally {
                    fclose($handle);
                }

                $tableCounts[$definition->name] = $count;
                $moduleCounts[$definition->module] = ($moduleCounts[$definition->module] ?? 0) + $count;
                $tablePaths[$definition->path()] = $localPath;
            }

            $latestSeason = $lockedUser->seasons()->latest('season_number')->first();
            $createdAt = CarbonImmutable::now('UTC');

            return [
                'manifest' => [
                    'archive_format_version' => self::FORMAT_VERSION,
                    'source_application' => 'Achelife',
                    'source_application_version' => config('achelife.application_version'),
                    'created_at' => $createdAt->toIso8601String(),
                    'created_local_date' => $createdAt->setTimezone($lockedUser->timezone)->toDateString(),
                    'user' => [
                        'original_id' => $lockedUser->id,
                        'timezone' => $lockedUser->timezone,
                        'calendar_started_on' => $lockedUser->calendar_started_on?->toDateString(),
                        'season_rollover_preference' => $lockedUser->season_rollover_preference->value,
                        'hold_next_season' => $lockedUser->hold_next_season,
                        'money_preset_pack_version' => $lockedUser->money_preset_pack_version,
                    ],
                    'latest_season' => $latestSeason === null ? null : [
                        'season_number' => $latestSeason->season_number,
                        'start_date' => $latestSeason->start_date->toDateString(),
                        'end_date' => $latestSeason->end_date->toDateString(),
                        'season_points' => $latestSeason->season_points,
                        'rank' => $latestSeason->rank,
                        'finalized' => $latestSeason->finalized_at !== null,
                    ],
                    'table_counts' => $tableCounts,
                    'module_counts' => $moduleCounts,
                    'files' => array_keys($tablePaths),
                ],
                'tablePaths' => $tablePaths,
            ];
        }, 3);
    }

    /** @param resource $handle
     * @param  array<string, mixed>  $row
     */
    private function writeNdjsonRow($handle, array $row): void
    {
        $line = json_encode($row, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n";

        if (fwrite($handle, $line) !== strlen($line)) {
            throw new RuntimeException('Unable to write archive data.');
        }
    }

    /** @param array<string, mixed> $value */
    private function writeJson(string $path, array $value): void
    {
        $json = json_encode($value, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n";

        if (file_put_contents($path, $json) === false) {
            throw new RuntimeException('Unable to write archive metadata.');
        }
    }

    /** @param array<string, string> $tablePaths */
    private function createZip(array $tablePaths, string $manifestPath, string $checksumsPath): string
    {
        $temporaryPath = tempnam(sys_get_temp_dir(), 'achelife-export-');

        if ($temporaryPath === false) {
            throw new RuntimeException('Unable to allocate archive storage.');
        }

        $archivePath = $temporaryPath.'.achelife.zip';
        unlink($temporaryPath);
        $zip = new ZipArchive;

        if ($zip->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Unable to create the Achelife archive.');
        }

        try {
            $zip->addFile($manifestPath, 'manifest.json');
            $zip->addFile($checksumsPath, 'checksums.json');

            foreach ($tablePaths as $archiveName => $localPath) {
                $zip->addFile($localPath, $archiveName);
            }
        } finally {
            $zip->close();
        }

        return $archivePath;
    }

    private function createWorkingDirectory(): string
    {
        $path = sys_get_temp_dir().'/achelife-export-'.bin2hex(random_bytes(12));

        if (! mkdir($path, 0700)) {
            throw new RuntimeException('Unable to allocate export workspace.');
        }

        return $path;
    }

    /** @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function normalizeDateOnlyValues(array $row): array
    {
        foreach ($row as $column => $value) {
            $isDateColumn = str_ends_with($column, '_date')
                || str_ends_with($column, '_on')
                || str_ends_with($column, '_before')
                || str_ends_with($column, '_through')
                || str_ends_with($column, '_from');

            if ($isDateColumn && is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}/', $value) === 1) {
                $row[$column] = substr($value, 0, 10);
            }
        }

        return $row;
    }

    private function removeWorkingDirectory(string $workingDirectory): void
    {
        foreach (glob($workingDirectory.'/*') ?: [] as $path) {
            @unlink($path);
        }

        @rmdir($workingDirectory);
    }
}
