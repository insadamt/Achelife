<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderTaskFoldersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'folder_ids' => ['required', 'array', 'min:1'],
            'folder_ids.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('task_folders', 'id')->where('user_id', $this->user()?->id),
            ],
        ];
    }
}
