<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;

class StoreManualTaskFocusSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task instanceof Task && $this->user()?->can('view', $task) === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'started_at' => ['required', 'string', 'max:19'],
            'ended_at' => ['required', 'string', 'max:19'],
        ];
    }
}
