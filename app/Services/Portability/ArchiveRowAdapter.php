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

        if ($formatVersion <= 3 && $table === 'task_series') {
            $row['task_project_id'] = null;
            $row['notes'] = null;
        }

        if ($formatVersion <= 3 && $table === 'tasks') {
            $row['task_project_id'] = null;
            $row['notes'] = null;
            $row['position'] = max(0, ((int) $row['id']) - 1);
        }

        if ($formatVersion <= 6 && in_array($table, ['task_folders', 'task_projects'], true)) {
            $row['archived_at'] = null;
        }

        if ($formatVersion <= 7 && in_array($table, ['task_folders', 'task_projects'], true)) {
            $row['color'] = null;
        }

        return $row;
    }
}
