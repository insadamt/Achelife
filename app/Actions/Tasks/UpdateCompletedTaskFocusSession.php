<?php

namespace App\Actions\Tasks;

use App\Data\Tasks\ManualFocusSessionData;
use App\Enums\TaskFocusSessionState;
use App\Models\TaskFocusSession;
use App\Models\User;
use App\Services\Tasks\TaskFocusIntervalIntegrity;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateCompletedTaskFocusSession
{
    public function __construct(private readonly TaskFocusIntervalIntegrity $integrity) {}

    public function execute(User $user, TaskFocusSession $session, ManualFocusSessionData $data): TaskFocusSession
    {
        if ($session->user_id !== $user->id) {
            throw new AuthorizationException;
        }

        return DB::transaction(function () use ($user, $session, $data): TaskFocusSession {
            User::query()->lockForUpdate()->findOrFail($user->id);
            $lockedSession = TaskFocusSession::query()->lockForUpdate()->findOrFail($session->id);

            if ($lockedSession->state !== TaskFocusSessionState::Completed || $lockedSession->active_marker !== null) {
                throw ValidationException::withMessages(['focus' => 'Only completed Focus Sessions can be edited.']);
            }

            $this->integrity->validate($user, $data, $lockedSession->id);
            $lockedSession->intervals()->delete();
            $lockedSession->intervals()->create([
                'started_at' => $data->startedAt,
                'ended_at' => $data->endedAt,
            ]);
            $lockedSession->update([
                'started_at' => $data->startedAt,
                'ended_at' => $data->endedAt,
                'accumulated_seconds' => $data->startedAt->diffInSeconds($data->endedAt),
            ]);

            return $lockedSession->refresh()->load('intervals');
        }, 3);
    }
}
