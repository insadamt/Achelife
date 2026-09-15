<?php

namespace App\Data\Tasks;

use App\Enums\TaskRecurrenceType;
use Carbon\CarbonImmutable;

readonly class TaskData
{
    /** @param list<int> $weekdays @param list<SubtaskData> $subtasks */
    public function __construct(
        public string $title,
        public CarbonImmutable $scheduledDate,
        public bool $important,
        public ?TaskRecurrenceType $recurrenceType,
        public array $weekdays,
        public array $subtasks,
        public ?int $projectId = null,
        public ?string $notes = null,
        public bool $projectProvided = false,
        public bool $notesProvided = false,
    ) {}

    /** @param array<string, mixed> $validated */
    public static function fromValidated(array $validated): self
    {
        return new self(
            title: $validated['title'],
            scheduledDate: CarbonImmutable::parse($validated['scheduled_date'])->startOfDay(),
            important: (bool) ($validated['important'] ?? false),
            recurrenceType: isset($validated['recurrence_type'])
                ? TaskRecurrenceType::from($validated['recurrence_type'])
                : null,
            weekdays: array_map('intval', $validated['weekdays'] ?? []),
            subtasks: array_map(
                fn (array $subtask): SubtaskData => new SubtaskData(
                    id: isset($subtask['id']) ? (int) $subtask['id'] : null,
                    title: $subtask['title'],
                ),
                $validated['subtasks'] ?? [],
            ),
            projectId: isset($validated['task_project_id']) ? (int) $validated['task_project_id'] : null,
            notes: $validated['notes'] ?? null,
            projectProvided: array_key_exists('task_project_id', $validated),
            notesProvided: array_key_exists('notes', $validated),
        );
    }
}
