<?php

namespace App\Http\Requests;

use App\Models\TaskFolder;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $folder = $this->route('folder');

        return $folder instanceof TaskFolder && $this->user()?->can('update', $folder) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
