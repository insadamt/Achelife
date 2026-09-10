<?php

namespace App\Actions\Money;

use App\Enums\MoneyDebtSettlementType;
use App\Models\MoneyDebt;
use App\Models\MoneyDebtSettlement;
use App\Services\Calendar\UserCalendar;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ForgiveMoneyDebtBalance
{
    public function __construct(private readonly UserCalendar $calendar) {}

    public function execute(MoneyDebt $debt): MoneyDebtSettlement
    {
        return DB::transaction(function () use ($debt): MoneyDebtSettlement {
            $lockedDebt = MoneyDebt::query()->lockForUpdate()->findOrFail($debt->id);
            $lockedDebt->settlements()->lockForUpdate()->get();
            $remainingAmount = $lockedDebt->remainingAmountMinor();

            if ($remainingAmount === 0) {
                throw ValidationException::withMessages(['debt' => 'This debt is already settled.']);
            }

            return $lockedDebt->settlements()->create([
                'user_id' => $lockedDebt->user_id,
                'type' => MoneyDebtSettlementType::Forgiveness,
                'amount_minor' => $remainingAmount,
                'settled_on' => $this->calendar->today($lockedDebt->user),
                'note' => null,
                'transaction_id' => null,
            ]);
        }, 3);
    }
}
