<?php

namespace App\Http\Requests;

use App\Models\TaskProject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MoveTaskProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $project instanceof TaskProject && $this->user()?->can('update', $project) === true;
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
            'position' => ['required', 'integer', 'min:0'],
        ];
    }
}
