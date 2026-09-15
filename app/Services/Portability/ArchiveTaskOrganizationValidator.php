<?php

namespace App\Services\Portability;

use App\Exceptions\InvalidAccountArchive;

class ArchiveTaskOrganizationValidator
{
    /** @var array<string, array<string, true>> */
    private array $positions = [];

    public function reset(): void
    {
        $this->positions = ['task_folders' => [], 'task_projects' => [], 'tasks' => []];
    }

    /** @param array<string, mixed> $row */
    public function validate(string $table, array $row): void
    {
        if (in_array($table, ['task_folders', 'task_projects', 'tasks'], true)) {
            $this->validatePosition($table, $row);
        }

        if (in_array($table, ['task_folders', 'task_projects'], true)
            && (! is_string($row['name']) || trim($row['name']) === '')) {
            throw new InvalidAccountArchive("{$table} contains an invalid name.");
        }

        if (in_array($table, ['task_series', 'tasks'], true)
            && $row['notes'] !== null
            && ! is_string($row['notes'])) {
            throw new InvalidAccountArchive("{$table} contains invalid notes.");
        }
    }

    /** @param array<string, mixed> $row */
    private function validatePosition(string $table, array $row): void
    {
        $position = filter_var($row['position'], FILTER_VALIDATE_INT);

        if ($position === false || $position < 0) {
            throw new InvalidAccountArchive("{$table} contains an invalid position.");
        }

        $container = match ($table) {
            'task_folders' => 'user',
            'task_projects' => 'folder:'.($row['task_folder_id'] ?? 'root'),
            default => 'project:'.($row['task_project_id'] ?? 'inbox'),
        };
        $key = $container.':'.$position;

        if (isset($this->positions[$table][$key])) {
            throw new InvalidAccountArchive("{$table} contains a duplicate position.");
        }

        $this->positions[$table][$key] = true;
    }
}
