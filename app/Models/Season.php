<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'season_number',
    'start_date',
    'end_date',
    'season_points',
    'rank',
    'introduced_at',
    'finalized_at',
    'reflection',
    'recap_seen_at',
])]
class Season extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Task, $this> */
    public function rewardedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'reward_season_id');
    }

    /** @return HasMany<HabitOccurrence, $this> */
    public function habitOccurrences(): HasMany
    {
        return $this->hasMany(HabitOccurrence::class);
    }

    /** @return HasMany<DiaryEntry, $this> */
    public function diaryEntries(): HasMany
    {
        return $this->hasMany(DiaryEntry::class);
    }

    /** @return HasMany<Violation, $this> */
    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }

    /** @return HasMany<Objective, $this> */
    public function objectives(): HasMany
    {
        return $this->hasMany(Objective::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'start_date' => 'immutable_date',
            'end_date' => 'immutable_date',
            'season_points' => 'integer',
            'introduced_at' => 'immutable_datetime',
            'finalized_at' => 'immutable_datetime',
            'recap_seen_at' => 'immutable_datetime',
        ];
    }
}
