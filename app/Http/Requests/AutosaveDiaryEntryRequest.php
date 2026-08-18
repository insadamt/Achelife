<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AutosaveDiaryEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'content' => ['required', 'array', 'max:10000'],
            'content.*.type' => ['required', 'string', 'in:text,mention'],
            'content.*.text' => ['nullable', 'string'],
            'content.*.personId' => ['nullable', 'integer', 'min:1'],
            'content.*.label' => ['nullable', 'string', 'max:255'],
            'language_code' => ['nullable', 'string', 'max:16'],
            'mood' => ['nullable', 'string', 'max:32'],
            'mood_group' => ['nullable', 'string', 'max:32'],
            'client_revision' => ['required', 'integer', 'min:1'],
        ];
    }
}
