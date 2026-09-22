<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;

class RescheduleTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task instanceof Task && $this->user()?->can('update', $task) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['scheduled_date' => ['required', 'date_format:Y-m-d']];
    }
}
