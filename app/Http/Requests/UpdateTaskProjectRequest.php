<?php

namespace App\Http\Requests;

use App\Models\TaskProject;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskProjectRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
        ];
    }
}
