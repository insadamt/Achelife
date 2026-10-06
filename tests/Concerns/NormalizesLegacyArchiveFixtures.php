<?php

namespace Tests\Concerns;

use App\Services\Portability\AccountArchiveExporter;
use App\Services\Portability\PortableTableRegistry;

trait NormalizesLegacyArchiveFixtures
{
    /** @param array<string, string> $entries */
    private function normalizeLegacyArchiveFixture(array &$entries): void
    {
        $manifest = json_decode($entries['manifest.json'], true, 512, JSON_THROW_ON_ERROR);
        $version = $manifest['archive_format_version'];
        if ($version < 1 || $version >= AccountArchiveExporter::FORMAT_VERSION) {
            return;
        }
        $definitions = app(PortableTableRegistry::class)->keyedDefinitions($version);
        $manifest['module_counts'] = [];
        foreach (array_keys($manifest['table_counts']) as $table) {
            $file = 'tables/'.$table.'.ndjson';
            if (! isset($definitions[$table])) {
                unset($entries[$file], $manifest['table_counts'][$table]);

                continue;
            }
            $definition = $definitions[$table];
            $manifest['module_counts'][$definition->module] = ($manifest['module_counts'][$definition->module] ?? 0) + $manifest['table_counts'][$table];
            $lines = array_values(array_filter(explode("\n", $entries[$file])));
            $rows = array_map(function (string $line) use ($definition, $version): string {
                $row = json_decode($line, true, 512, JSON_THROW_ON_ERROR);
                $row = array_intersect_key($row, array_flip($definition->columns));
                if ($definition->name === 'appearance_settings' && $version <= 10) {
                    unset($row['light_accent'], $row['dark_accent']);
                }

                return json_encode($row, JSON_THROW_ON_ERROR);
            }, $lines);
            $entries[$file] = $rows === [] ? '' : implode("\n", $rows)."\n";
        }
        $manifest['files'] = array_map(fn (string $table): string => 'tables/'.$table.'.ndjson', array_keys($manifest['table_counts']));
        $entries['manifest.json'] = json_encode($manifest, JSON_THROW_ON_ERROR);
    }
}
