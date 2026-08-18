<?php

namespace App\Http\Requests;

use App\Enums\HabitDifficulty;
use App\Enums\HabitScheduleType;
use App\Enums\HabitType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHabitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(HabitType::class)],
            'unit' => ['exclude_unless:type,numeric', 'required_if:type,numeric', 'string', 'max:40'],
            'numeric_target' => ['exclude_unless:type,numeric', 'required_if:type,numeric', 'numeric', 'gt:0', 'max:999999999'],
            'difficulty' => ['required', Rule::enum(HabitDifficulty::class)],
            'schedule_type' => ['required', Rule::enum(HabitScheduleType::class)],
            'weekdays' => ['exclude_unless:schedule_type,selected_weekdays', 'required_if:schedule_type,selected_weekdays', 'array', 'min:1', 'max:7'],
            'weekdays.*' => ['integer', 'between:1,7', 'distinct'],
            'flexible' => ['sometimes', 'boolean'],
        ];
    }
}
