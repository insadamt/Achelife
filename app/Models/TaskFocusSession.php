<?php

namespace App\Models;

use App\Enums\TaskFocusSessionSource;
use App\Enums\TaskFocusSessionState;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'task_id', 'started_at', 'ended_at', 'accumulated_seconds', 'state', 'source', 'active_marker'])]
class TaskFocusSession extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /** @return HasMany<TaskFocusInterval, $this> */
    public function intervals(): HasMany
    {
        return $this->hasMany(TaskFocusInterval::class)->orderBy('started_at')->orderBy('id');
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'ended_at' => 'immutable_datetime',
            'accumulated_seconds' => 'integer',
            'state' => TaskFocusSessionState::class,
            'source' => TaskFocusSessionSource::class,
            'active_marker' => 'integer',
        ];
    }
}
