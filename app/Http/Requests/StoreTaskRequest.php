<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'scheduled_date' => ['required', 'date_format:Y-m-d'],
            'important' => ['sometimes', 'boolean'],
            'task_project_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('task_projects', 'id')->where('user_id', $this->user()?->id),
            ],
            'notes' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'recurrence_type' => ['nullable', Rule::in(['daily', 'weekdays'])],
            'weekdays' => ['exclude_unless:recurrence_type,weekdays', 'required_if:recurrence_type,weekdays', 'array', 'min:1', 'max:7'],
            'weekdays.*' => ['integer', 'between:1,7', 'distinct'],
            'subtasks' => ['sometimes', 'array'],
            'subtasks.*.title' => ['required', 'string', 'max:255'],
        ];
    }
}
