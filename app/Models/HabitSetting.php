<?php

namespace App\Models;

use App\Enums\HabitCalendarLabels;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'calendar_labels'])]
class HabitSetting extends Model
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
        return ['calendar_labels' => HabitCalendarLabels::class];
    }
}
