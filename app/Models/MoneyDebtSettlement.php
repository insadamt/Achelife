<?php

namespace App\Models;

use App\Enums\MoneyDebtSettlementType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'debt_id', 'type', 'amount_minor', 'settled_on', 'note', 'transaction_id'])]
class MoneyDebtSettlement extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function debt(): BelongsTo
    {
        return $this->belongsTo(MoneyDebt::class, 'debt_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(MoneyTransaction::class, 'transaction_id');
    }

    protected function casts(): array
    {
        return [
            'type' => MoneyDebtSettlementType::class,
            'amount_minor' => 'integer',
            'settled_on' => 'immutable_date',
        ];
    }
}
