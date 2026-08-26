<?php

namespace App\Models;

use App\Enums\SeasonIntermissionReason;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'after_season_id', 'reason', 'started_on', 'ended_before'])]
class SeasonIntermission extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Season, $this> */
    public function afterSeason(): BelongsTo
    {
        return $this->belongsTo(Season::class, 'after_season_id');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'reason' => SeasonIntermissionReason::class,
            'started_on' => 'immutable_date',
            'ended_before' => 'immutable_date',
        ];
    }
}
