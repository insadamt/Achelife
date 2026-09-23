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

        if ($formatVersion <= 8 && $table === 'money_categories') {
            $row['color'] = $this->legacyCategoryColor((int) $row['id']);
        }

        return $row;
    }

    private function legacyCategoryColor(int $id): string
    {
        $hue = fmod(max(1, $id) * 137.508, 360);
        $chroma = (1 - abs(2 * 0.56 - 1)) * 0.64;
        $secondary = $chroma * (1 - abs(fmod($hue / 60, 2) - 1));
        $channels = match (true) {
            $hue < 60 => [$chroma, $secondary, 0],
            $hue < 120 => [$secondary, $chroma, 0],
            $hue < 180 => [0, $chroma, $secondary],
            $hue < 240 => [0, $secondary, $chroma],
            $hue < 300 => [$secondary, 0, $chroma],
            default => [$chroma, 0, $secondary],
        };
        $offset = 0.56 - $chroma / 2;

        return strtoupper('#'.collect($channels)->map(fn (float $channel): string => str_pad(dechex((int) round(($channel + $offset) * 255)), 2, '0', STR_PAD_LEFT))->implode(''));
    }
}
