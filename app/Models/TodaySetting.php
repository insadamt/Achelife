<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'show_flexible_habits', 'show_upcoming_tasks'])]
class TodaySetting extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'show_flexible_habits' => 'boolean',
            'show_upcoming_tasks' => 'boolean',
        ];
    }
}
