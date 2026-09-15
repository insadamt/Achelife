<?php

namespace App\Http\Requests;

use App\Models\TaskFocusSession;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskFocusSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('session');

        return $session instanceof TaskFocusSession && $session->user_id === $this->user()?->id;
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
