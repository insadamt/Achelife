<?php

namespace App\Models;

use App\Enums\LawSeverity;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

#[Fillable(['user_id', 'name', 'severity', 'archived_at'])]
class Law extends Model
{
    protected static function booted(): void
    {
        static::updating(function (Law $law): void {
            if ($law->getOriginal('archived_at') !== null) {
                throw new LogicException('Archived Laws are permanently read-only.');
            }
        });
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Violation, $this> */
    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'severity' => LawSeverity::class,
            'archived_at' => 'immutable_datetime',
        ];
    }
}
