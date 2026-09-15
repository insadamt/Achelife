<?php

namespace App\Actions\Tasks;

use App\Enums\TaskFocusSessionState;
use App\Models\TaskFocusSession;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteCompletedTaskFocusSession
{
    public function execute(User $user, TaskFocusSession $session): void
    {
        if ($session->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        DB::transaction(function () use ($user, $session): void {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $lockedSession = TaskFocusSession::query()->lockForUpdate()->findOrFail($session->id);

            if ($lockedSession->state !== TaskFocusSessionState::Completed || $lockedSession->active_marker !== null) {
                throw ValidationException::withMessages(['focus' => 'Only completed Focus Sessions can be deleted.']);
            }

            $lockedSession->delete();
        }, 3);
    }
}
