<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task instanceof Task && $this->user()?->can('update', $task) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'scheduled_date' => ['required', 'date_format:Y-m-d'],
            'important' => ['required', 'boolean'],
            'recurrence_type' => ['nullable', Rule::in(['daily', 'weekdays'])],
            'weekdays' => ['exclude_unless:recurrence_type,weekdays', 'required_if:recurrence_type,weekdays', 'array', 'min:1', 'max:7'],
            'weekdays.*' => ['integer', 'between:1,7', 'distinct'],
            'subtasks' => ['present', 'array', 'max:20'],
            'subtasks.*.id' => ['nullable', 'integer'],
            'subtasks.*.title' => ['required', 'string', 'max:255'],
        ];
    }
}
