<?php

namespace App\Http\Requests;

use App\Enums\HabitCalendarLabels;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHabitSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['calendar_labels' => ['required', Rule::enum(HabitCalendarLabels::class)]];
    }
}
