<?php

namespace App\Http\Requests;

use App\Models\Habit;
use Illuminate\Foundation\Http\FormRequest;

class StoreNumericHabitValueRequest extends FormRequest
{
    public function authorize(): bool
    {
        $habit = $this->route('habit');

        return $habit instanceof Habit && $this->user()?->can('update', $habit) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['value' => ['nullable', 'numeric', 'min:0', 'max:999999999']];
    }
}
