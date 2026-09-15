<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MoveTaskRequest extends FormRequest
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
            'task_project_id' => [
                'present',
                'nullable',
                'integer',
                Rule::exists('task_projects', 'id')->where('user_id', $this->user()?->id),
            ],
            'position' => ['required', 'integer', 'min:0'],
        ];
    }
}
