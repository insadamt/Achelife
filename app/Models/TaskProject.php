<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'task_folder_id', 'name', 'position'])]
class TaskProject extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<TaskFolder, $this> */
    public function folder(): BelongsTo
    {
        return $this->belongsTo(TaskFolder::class, 'task_folder_id');
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('position')->orderBy('id');
    }

    /** @return HasMany<TaskSeries, $this> */
    public function taskSeries(): HasMany
    {
        return $this->hasMany(TaskSeries::class);
    }
}
