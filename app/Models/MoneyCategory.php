<?php

namespace App\Models;

use App\Enums\MoneyCategoryType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'type', 'name', 'preset_key', 'archived_at'])]
class MoneyCategory extends Model
{
    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<MoneySubcategory, $this> */
    public function subcategories(): HasMany
    {
        return $this->hasMany(MoneySubcategory::class, 'category_id');
    }

    /** @return HasMany<MoneyTransaction, $this> */
    public function transactions(): HasMany
    {
        return $this->hasMany(MoneyTransaction::class, 'category_id');
    }

    protected function casts(): array
    {
        return [
            'type' => MoneyCategoryType::class,
            'archived_at' => 'immutable_datetime',
        ];
    }
}
