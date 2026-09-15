<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'task_project_id' => [
                'present',
                'nullable',
                'integer',
                Rule::exists('task_projects', 'id')->where('user_id', $this->user()?->id),
            ],
            'task_ids' => ['required', 'array', 'min:1'],
            'task_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()?->id),
            ],
        ];
    }
}
