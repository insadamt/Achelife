<?php

namespace App\Services\Portability;

use App\Exceptions\InvalidAccountArchive;

class ArchiveFormatAdapterRegistry
{
    public function requireSupported(int $formatVersion): void
    {
        if (in_array($formatVersion, [1, AccountArchiveExporter::FORMAT_VERSION], true)) {
            return;
        }

        if ($formatVersion > AccountArchiveExporter::FORMAT_VERSION) {
            throw new InvalidAccountArchive('This backup uses a newer archive format. Update Achelife first.');
        }

        throw new InvalidAccountArchive("Archive format {$formatVersion} has no explicit compatibility adapter.");
    }
}
