<?php

namespace App\Models;

use App\Enums\TaskRecurrenceType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'title',
    'important',
    'recurrence_type',
    'weekdays',
    'subtask_template',
    'starts_on',
    'ends_before',
    'materialized_through',
])]
class TaskSeries extends Model
{
    protected $table = 'task_series';

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /** @return HasMany<TaskSeriesExclusion, $this> */
    public function exclusions(): HasMany
    {
        return $this->hasMany(TaskSeriesExclusion::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'important' => 'boolean',
            'recurrence_type' => TaskRecurrenceType::class,
            'weekdays' => 'array',
            'subtask_template' => 'array',
            'starts_on' => 'immutable_date',
            'ends_before' => 'immutable_date',
            'materialized_through' => 'immutable_date',
        ];
    }
}
