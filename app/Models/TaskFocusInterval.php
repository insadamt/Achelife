<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['task_focus_session_id', 'started_at', 'ended_at'])]
class TaskFocusInterval extends Model
{
    /** @return BelongsTo<TaskFocusSession, $this> */
    public function session(): BelongsTo
    {
        return $this->belongsTo(TaskFocusSession::class, 'task_focus_session_id');
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'ended_at' => 'immutable_datetime',
        ];
    }
}
