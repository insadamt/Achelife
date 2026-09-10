<?php

namespace App\Services\Money;

use App\Enums\MoneyDebtDirection;
use App\Enums\MoneyTransactionType;
use App\Models\MoneyAccount;
use App\Models\MoneyTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;

class MoneyDebtAccountMovementRecorder
{
    public function recordOpening(
        User $user,
        MoneyDebtDirection $direction,
        int $amountMinor,
        MoneyAccount $account,
        CarbonImmutable $date,
        ?string $note,
    ): MoneyTransaction {
        $type = $direction === MoneyDebtDirection::Payable
            ? MoneyTransactionType::Income
            : MoneyTransactionType::Expense;

        return $this->record($user, $type, $amountMinor, $account, $date, $note);
    }

    public function recordRepayment(
        User $user,
        MoneyDebtDirection $direction,
        int $amountMinor,
        MoneyAccount $account,
        CarbonImmutable $date,
        ?string $note,
    ): MoneyTransaction {
        $type = $direction === MoneyDebtDirection::Payable
            ? MoneyTransactionType::Expense
            : MoneyTransactionType::Income;

        return $this->record($user, $type, $amountMinor, $account, $date, $note);
    }

    private function record(
        User $user,
        MoneyTransactionType $type,
        int $amountMinor,
        MoneyAccount $account,
        CarbonImmutable $date,
        ?string $note,
    ): MoneyTransaction {
        return $user->moneyTransactions()->create([
            'type' => $type,
            'amount_minor' => $amountMinor,
            'fee_minor' => 0,
            'account_id' => $account->id,
            'destination_account_id' => null,
            'category_id' => null,
            'subcategory_id' => null,
            'transaction_date' => $date,
            'note' => $note,
        ]);
    }
}
