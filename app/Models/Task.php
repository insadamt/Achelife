<?php

namespace App\Models;

use App\Enums\TaskCompletionTiming;
use App\Enums\TaskRecurrenceType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'task_series_id',
    'title',
    'scheduled_date',
    'occurrence_date',
    'important',
    'recurrence_type_snapshot',
    'recurrence_weekdays_snapshot',
    'completed_at',
    'completion_timing',
    'importance_at_completion',
    'earned_sp',
    'reward_season_id',
])]
class Task extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<TaskSeries, $this> */
    public function series(): BelongsTo
    {
        return $this->belongsTo(TaskSeries::class, 'task_series_id');
    }

    /** @return HasMany<Subtask, $this> */
    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class)->orderBy('position');
    }

    /** @return HasMany<TaskReschedule, $this> */
    public function reschedules(): HasMany
    {
        return $this->hasMany(TaskReschedule::class)->orderBy('rescheduled_at');
    }

    /** @return BelongsTo<Season, $this> */
    public function rewardSeason(): BelongsTo
    {
        return $this->belongsTo(Season::class, 'reward_season_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'scheduled_date' => 'immutable_date',
            'occurrence_date' => 'immutable_date',
            'important' => 'boolean',
            'recurrence_type_snapshot' => TaskRecurrenceType::class,
            'recurrence_weekdays_snapshot' => 'array',
            'completed_at' => 'immutable_datetime',
            'completion_timing' => TaskCompletionTiming::class,
            'importance_at_completion' => 'boolean',
            'earned_sp' => 'integer',
        ];
    }
}
