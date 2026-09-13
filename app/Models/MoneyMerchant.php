<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'name', 'normalized_name', 'archived_at'])]
class MoneyMerchant extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<MoneyTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'merchant_id');
    }

    protected function casts(): array
    {
        return ['archived_at' => 'immutable_datetime'];
    }
}
