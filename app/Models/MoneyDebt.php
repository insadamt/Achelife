<?php

namespace App\Models;

use App\Enums\MoneyDebtDirection;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'person_id', 'direction', 'original_amount_minor', 'currency', 'opened_on', 'due_on', 'note', 'opening_transaction_id'])]
class MoneyDebt extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function openingTransaction(): BelongsTo
    {
        return $this->belongsTo(MoneyTransaction::class, 'opening_transaction_id');
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(MoneyDebtSettlement::class, 'debt_id');
    }

    public function settledAmountMinor(): int
    {
        if ($this->relationLoaded('settlements')) {
            return (int) $this->settlements->sum('amount_minor');
        }

        return (int) $this->settlements()->sum('amount_minor');
    }

    public function remainingAmountMinor(): int
    {
        return max(0, $this->original_amount_minor - $this->settledAmountMinor());
    }

    protected function casts(): array
    {
        return [
            'direction' => MoneyDebtDirection::class,
            'original_amount_minor' => 'integer',
            'opened_on' => 'immutable_date',
            'due_on' => 'immutable_date',
        ];
    }
}
