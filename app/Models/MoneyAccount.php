<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'currency', 'initial_balance_minor', 'theme_index', 'visual_identifier', 'archived_at'])]
class MoneyAccount extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<MoneyTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'account_id');
    }

    /** @return HasMany<MoneyTransaction, $this> */
    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'destination_account_id');
    }

    protected function casts(): array
    {
        return [
            'initial_balance_minor' => 'integer',
            'theme_index' => 'integer',
            'archived_at' => 'immutable_datetime',
        ];
    }
}
