<?php

namespace App\Http\Requests;

use App\Models\Violation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateViolationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $violation = $this->route('violation');

        return $violation instanceof Violation && $this->user()?->can('update', $violation) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['date' => ['required', 'date_format:Y-m-d']];
    }
}
