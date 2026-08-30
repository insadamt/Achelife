<?php

namespace App\Services\Portability;

use App\Data\Portability\PortableTableDefinition;
use App\Data\Portability\ValidatedArchive;
use App\Exceptions\InvalidAccountArchive;
use App\Models\Season;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ArchiveDatabaseImporter
{
    /** @var array<string, array<int, int>> */
    private array $idMaps = [];

    public function __construct(
        private readonly PortableTableRegistry $tableRegistry,
        private readonly ArchiveReader $reader,
    ) {}

    public function replaceAccountData(User $lockedUser, ValidatedArchive $archive): Season
    {
        $this->idMaps = [];
        $this->deleteExistingGraph($lockedUser);

        foreach ($this->tableRegistry->definitions() as $definition) {
            $this->importTable($lockedUser, $archive, $definition);
        }

        $this->validateImportedCounts($lockedUser, $archive);
        $this->validateImportedSubscriptionLinks($lockedUser);

        $latestSeason = $lockedUser->seasons()->latest('season_number')->first();

        if ($latestSeason === null) {
            throw new InvalidAccountArchive('A portable restore requires at least one Season.');
        }

        return $latestSeason;
    }

    private function deleteExistingGraph(User $user): void
    {
        $ownedIds = [];

        foreach ($this->tableRegistry->definitions() as $definition) {
            if ($definition->identityColumn === null) {
                continue;
            }

            $ownedIds[$definition->name] = $this->tableRegistry
                ->queryForUser($definition, $user->id, $ownedIds)
                ->pluck($definition->identityColumn)
                ->map(fn ($id): int => (int) $id)
                ->all();
        }

        foreach (array_reverse($this->tableRegistry->definitions()) as $definition) {
            if ($definition->name === 'users') {
                continue;
            }

            $this->tableRegistry->queryForUser($definition, $user->id, $ownedIds)->delete();
        }
    }

    private function importTable(User $user, ValidatedArchive $archive, PortableTableDefinition $definition): void
    {
        foreach ($this->reader->rows($archive->path, $definition->path()) as $row) {
            if ($definition->name === 'users') {
                $this->updateSafeProfile($user, $row);

                continue;
            }

            $oldId = $definition->identityColumn === null ? null : (int) $row[$definition->identityColumn];

            if ($definition->identityColumn !== null) {
                unset($row[$definition->identityColumn]);
            }

            if (array_key_exists('user_id', $row)) {
                $row['user_id'] = $user->id;
            }

            foreach ($definition->foreignKeys as $column => $referencedTable) {
                if ($row[$column] !== null) {
                    $row[$column] = $this->mappedId($referencedTable, (int) $row[$column]);
                }
            }

            if ($definition->name === 'diary_entries') {
                $row['content'] = $this->remapDiaryContent($row['content']);
            }

            $newId = $this->insertRow($user, $definition, $row);

            if ($oldId !== null) {
                $this->idMaps[$definition->name][$oldId] = $newId;
            }
        }
    }

    /** @param array<string, mixed> $row */
    private function updateSafeProfile(User $user, array $row): void
    {
        $user->update([
            'name' => $row['name'],
            'timezone' => $row['timezone'],
            'calendar_started_on' => $row['calendar_started_on'],
            'season_rollover_preference' => $row['season_rollover_preference'],
            'hold_next_season' => true,
            'money_preset_pack_version' => $row['money_preset_pack_version'],
            'onboarding_step' => 'complete',
            'onboarding_completed_at' => now(),
        ]);
    }

    /** @param array<string, mixed> $row */
    private function insertRow(User $user, PortableTableDefinition $definition, array $row): int
    {
        if (in_array($definition->name, ['money_categories', 'money_subcategories'], true) && $row['preset_key'] !== null) {
            $existingId = DB::table($definition->name)
                ->where('user_id', $user->id)
                ->where('preset_key', $row['preset_key'])
                ->value('id');

            if ($existingId !== null) {
                DB::table($definition->name)->where('id', $existingId)->update($row);

                return (int) $existingId;
            }
        }

        if ($definition->identityColumn === null) {
            DB::table($definition->name)->insert($row);

            return $user->id;
        }

        return (int) DB::table($definition->name)->insertGetId($row);
    }

    private function mappedId(string $table, int $oldId): int
    {
        $mapped = $this->idMaps[$table][$oldId] ?? null;

        if ($mapped === null) {
            throw new InvalidAccountArchive("A {$table} relationship could not be mapped during restore.");
        }

        return $mapped;
    }

    private function remapDiaryContent(mixed $content): string
    {
        $nodes = is_array($content) ? $content : json_decode((string) $content, true, 512, JSON_THROW_ON_ERROR);

        foreach ($nodes as &$node) {
            if (($node['type'] ?? null) === 'mention' && isset($node['personId'])) {
                $node['personId'] = $this->mappedId('people', (int) $node['personId']);
            }
        }

        return json_encode($nodes, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function validateImportedCounts(User $user, ValidatedArchive $archive): void
    {
        $ownedIds = [];

        foreach ($this->tableRegistry->definitions() as $definition) {
            $query = $this->tableRegistry->queryForUser($definition, $user->id, $ownedIds);
            $count = $query->count();

            if ($count !== (int) $archive->manifest['table_counts'][$definition->name]) {
                throw new InvalidAccountArchive("{$definition->name} did not restore its declared row count.");
            }

            if ($definition->identityColumn !== null) {
                $ownedIds[$definition->name] = $query->pluck($definition->identityColumn)->map(fn ($id): int => (int) $id)->all();
            }
        }
    }

    private function validateImportedSubscriptionLinks(User $user): void
    {
        $invalidCount = $user->moneySubscriptionOccurrences()
            ->where('status', 'paid')
            ->where(function ($query): void {
                $query->whereNull('transaction_id')->orWhereNull('paid_at');
            })
            ->count();

        if ($invalidCount > 0) {
            throw new InvalidAccountArchive('Paid Subscription links failed post-import validation.');
        }
    }
}
