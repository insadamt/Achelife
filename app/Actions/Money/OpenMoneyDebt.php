<?php

namespace App\Actions\Money;

use App\Data\Money\MoneyDebtData;
use App\Models\MoneyAccount;
use App\Models\MoneyDebt;
use App\Models\Person;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\MoneyDebtAccountMovementRecorder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OpenMoneyDebt
{
    public function __construct(
        private readonly UserCalendar $calendar,
        private readonly MoneyDebtAccountMovementRecorder $movementRecorder,
    ) {}

    public function execute(User $user, MoneyDebtData $data): MoneyDebt
    {
        return DB::transaction(function () use ($user, $data): MoneyDebt {
            $this->validateDates($user, $data);
            $person = $this->resolvePerson($user, $data);
            $account = $this->resolveAccount($user, $data->accountId);

            $transaction = $this->movementRecorder->recordOpening(
                $user,
                $data->direction,
                $data->amountMinor,
                $account,
                $data->openedOn,
                $data->note,
            );

            return $user->moneyDebts()->create([
                'person_id' => $person->id,
                'direction' => $data->direction,
                'original_amount_minor' => $data->amountMinor,
                'currency' => $account->currency,
                'opened_on' => $data->openedOn,
                'due_on' => $data->dueOn,
                'note' => $data->note,
                'opening_transaction_id' => $transaction->id,
            ]);
        }, 3);
    }

    private function validateDates(User $user, MoneyDebtData $data): void
    {
        if ($data->amountMinor <= 0) {
            throw ValidationException::withMessages(['amount' => 'The amount must be greater than zero.']);
        }

        if ($data->openedOn->isAfter($this->calendar->today($user))) {
            throw ValidationException::withMessages(['opened_on' => 'A debt cannot begin in the future.']);
        }

        if ($data->dueOn !== null && $data->dueOn->isBefore($data->openedOn)) {
            throw ValidationException::withMessages(['due_on' => 'The due date cannot be before the debt began.']);
        }
    }

    private function resolvePerson(User $user, MoneyDebtData $data): Person
    {
        if ($data->personId !== null) {
            $person = $user->people()->lockForUpdate()->find($data->personId);

            if ($person === null) {
                throw ValidationException::withMessages(['person_id' => 'The selected Person does not belong to you.']);
            }

            if ($person->archived_at !== null) {
                throw ValidationException::withMessages(['person_id' => 'Archived People cannot be selected for a new debt.']);
            }

            return $person;
        }

        if ($data->personName === null || trim($data->personName) === '') {
            throw ValidationException::withMessages(['person_name' => 'Enter the new Person’s name.']);
        }

        return $user->people()->create([
            'name' => trim($data->personName),
            'nickname' => $data->personNickname === null ? null : trim($data->personNickname),
        ]);
    }

    private function resolveAccount(User $user, int $accountId): MoneyAccount
    {
        $account = $user->moneyAccounts()->lockForUpdate()->find($accountId);

        if ($account === null) {
            throw ValidationException::withMessages(['account_id' => 'The selected Account does not belong to you.']);
        }

        if ($account->archived_at !== null) {
            throw ValidationException::withMessages(['account_id' => 'Reactivate this Account before recording a new debt movement.']);
        }

        return $account;
    }
}
