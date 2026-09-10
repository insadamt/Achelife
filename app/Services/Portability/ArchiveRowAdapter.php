<?php

namespace App\Services\Portability;

class ArchiveRowAdapter
{
    /** @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    public function adapt(int $formatVersion, string $table, array $row): array
    {
        if ($formatVersion === 1 && $table === 'habits' && ! array_key_exists('icon', $row)) {
            $row['icon'] = 'check';
        }

        return $row;
    }
}
