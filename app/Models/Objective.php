<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use LogicException;

#[Fillable([
    'user_id',
    'season_id',
    'title',
    'creation_order',
    'completed_at',
    'earned_sp',
])]
class Objective extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (Objective $objective): void {
            if (self::query()->where('season_id', $objective->season_id)->count() >= 3) {
                throw new LogicException('A Season cannot contain more than three Objectives.');
            }
        });

        static::saving(function (Objective $objective): void {
            $season = Season::query()->findOrFail($objective->season_id);
            $hasCompletionTimestamp = $objective->completed_at !== null;
            $hasEarnedReward = $objective->earned_sp !== null;

            if ($season->user_id !== $objective->user_id) {
                throw new LogicException('An Objective must share ownership with its Season.');
            }

            if ($objective->creation_order < 1) {
                throw new LogicException('An Objective creation order must be positive.');
            }

            if ($hasCompletionTimestamp !== $hasEarnedReward) {
                throw new LogicException('An Objective completion timestamp and exact reward must be stored together.');
            }

            if ($hasEarnedReward && ! in_array($objective->earned_sp, [100, 150, 300], true)) {
                throw new LogicException('An Objective exact reward must use the centralized distribution.');
            }
        });
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Season, $this> */
    public function season(): BelongsTo
    {
        return $this->belongsTo(Season::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'creation_order' => 'integer',
            'completed_at' => 'immutable_datetime',
            'earned_sp' => 'integer',
            'deleted_at' => 'immutable_datetime',
        ];
    }
}
