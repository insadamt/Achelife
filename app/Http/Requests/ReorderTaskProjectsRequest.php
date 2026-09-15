<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderTaskProjectsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'task_folder_id' => [
                'present',
                'nullable',
                'integer',
                Rule::exists('task_folders', 'id')->where('user_id', $this->user()?->id),
            ],
            'project_ids' => ['required', 'array', 'min:1'],
            'project_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('task_projects', 'id')->where('user_id', $this->user()?->id),
            ],
        ];
    }
}
