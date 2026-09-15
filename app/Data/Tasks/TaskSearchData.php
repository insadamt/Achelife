<?php

namespace App\Data\Tasks;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

readonly class TaskSearchData
{
    public function __construct(
        public string $query,
        public string $status,
        public string $project,
        public string $important,
    ) {}

    public static function fromRequest(Request $request, User $user): self
    {
        $query = Str::limit(trim($request->string('search')->toString()), 500, '');
        $status = $request->string('status')->toString();
        $important = $request->string('important')->toString();
        $requestedProject = $request->string('task_project')->toString();

        return new self(
            query: $query,
            status: in_array($status, ['incomplete', 'completed'], true) ? $status : 'all',
            project: self::projectFilter($requestedProject, $user),
            important: in_array($important, ['yes', 'no'], true) ? $important : 'all',
        );
    }

    public function active(): bool
    {
        return $this->query !== ''
            || $this->status !== 'all'
            || $this->project !== 'all'
            || $this->important !== 'all';
    }

    /** @return array<string, string> */
    public function toArray(): array
    {
        return [
            'search' => $this->query,
            'status' => $this->status,
            'taskProject' => $this->project,
            'important' => $this->important,
        ];
    }

    private static function projectFilter(string $requestedProject, User $user): string
    {
        if ($requestedProject === 'inbox') {
            return 'inbox';
        }

        if (ctype_digit($requestedProject)
            && $user->taskProjects()->whereKey((int) $requestedProject)->exists()) {
            return $requestedProject;
        }

        return 'all';
    }
}
