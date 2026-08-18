<?php

namespace App\Http\Requests;

use App\Enums\LawSeverity;
use App\Models\Law;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLawRequest extends FormRequest
{
    public function authorize(): bool
    {
        $law = $this->route('law');

        return $law instanceof Law && $this->user()?->can('update', $law) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'severity' => ['required', Rule::enum(LawSeverity::class)],
        ];
    }
}
