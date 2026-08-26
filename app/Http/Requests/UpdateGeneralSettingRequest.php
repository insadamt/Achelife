<?php

namespace App\Http\Requests;

use App\Enums\SeasonRolloverPreference;
use DateTimeZone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGeneralSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'timezone' => ['required', 'string', 'max:64', Rule::in([...DateTimeZone::listIdentifiers(), 'UTC'])],
            'season_rollover_preference' => ['sometimes', Rule::enum(SeasonRolloverPreference::class)],
        ];
    }
}
