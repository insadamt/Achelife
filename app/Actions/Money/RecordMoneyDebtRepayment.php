<?php

namespace App\Actions\Money;

use App\Data\Money\MoneyDebtRepaymentData;
use App\Enums\MoneyDebtSettlementType;
use App\Models\MoneyAccount;
use App\Models\MoneyDebt;
use App\Models\MoneyDebtSettlement;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\MoneyDebtAccountMovementRecorder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordMoneyDebtRepayment
{
    public function __construct(
        private readonly UserCalendar $calendar,
        private readonly MoneyDebtAccountMovementRecorder $movementRecorder,
    ) {}

    public function execute(MoneyDebt $debt, MoneyDebtRepaymentData $data): MoneyDebtSettlement
    {
        return DB::transaction(function () use ($debt, $data): MoneyDebtSettlement {
            $lockedDebt = MoneyDebt::query()->lockForUpdate()->findOrFail($debt->id);
            $lockedDebt->settlements()->lockForUpdate()->get();
            $this->validate($lockedDebt, $data);
            $account = $this->resolveAccount($lockedDebt, $data->accountId);
            $transaction = $account === null ? null : $this->movementRecorder->recordRepayment(
                $lockedDebt->user,
                $lockedDebt->direction,
                $data->amountMinor,
                $account,
                $data->settledOn,
                $data->note,
            );

            return $lockedDebt->settlements()->create([
                'user_id' => $lockedDebt->user_id,
                'type' => MoneyDebtSettlementType::Repayment,
                'amount_minor' => $data->amountMinor,
                'settled_on' => $data->settledOn,
                'note' => $data->note,
                'transaction_id' => $transaction?->id,
            ]);
        }, 3);
    }

    private function validate(MoneyDebt $debt, MoneyDebtRepaymentData $data): void
    {
        if ($data->amountMinor <= 0) {
            throw ValidationException::withMessages(['amount' => 'The repayment must be greater than zero.']);
        }

        if ($data->amountMinor > $debt->remainingAmountMinor()) {
            throw ValidationException::withMessages(['amount' => 'The repayment cannot exceed the remaining balance.']);
        }

        if ($data->settledOn->isBefore($debt->opened_on)) {
            throw ValidationException::withMessages(['settled_on' => 'A repayment cannot be dated before the debt began.']);
        }

        if ($data->settledOn->isAfter($this->calendar->today($debt->user))) {
            throw ValidationException::withMessages(['settled_on' => 'A repayment cannot be dated in the future.']);
        }
    }

    private function resolveAccount(MoneyDebt $debt, ?int $accountId): ?MoneyAccount
    {
        if ($accountId === null) {
            return null;
        }

        $account = $debt->user->moneyAccounts()->lockForUpdate()->find($accountId);

        if ($account === null) {
            throw ValidationException::withMessages(['account_id' => 'The selected Account does not belong to you.']);
        }

        if ($account->archived_at !== null) {
            throw ValidationException::withMessages(['account_id' => 'Reactivate this Account before recording a repayment.']);
        }

        if ($account->currency !== $debt->currency) {
            throw ValidationException::withMessages(['account_id' => 'The repayment Account must use the debt currency.']);
        }

        return $account;
    }
}
