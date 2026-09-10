<?php

namespace App\Support\Money;

use App\Models\MoneyDebt;
use App\Models\MoneyDebtSettlement;
use Carbon\CarbonImmutable;

class MoneyDebtViewDataFactory
{
    /** @return array<string, mixed> */
    public function debt(MoneyDebt $debt, CarbonImmutable $today): array
    {
        $remainingAmount = $debt->remainingAmountMinor();
        $status = $remainingAmount === 0
            ? 'settled'
            : ($debt->due_on !== null && $debt->due_on->isBefore($today) ? 'overdue' : 'active');

        return [
            'id' => $debt->id,
            'direction' => $debt->direction->value,
            'originalAmountMinor' => $debt->original_amount_minor,
            'settledAmountMinor' => $debt->settledAmountMinor(),
            'remainingAmountMinor' => $remainingAmount,
            'currency' => $debt->currency,
            'openedOn' => $debt->opened_on->toDateString(),
            'dueOn' => $debt->due_on?->toDateString(),
            'note' => $debt->note,
            'status' => $status,
            'canDelete' => $debt->settlements->isEmpty(),
            'person' => [
                'id' => $debt->person->id,
                'name' => $debt->person->name,
                'nickname' => $debt->person->nickname,
                'archived' => $debt->person->archived_at !== null,
            ],
            'openingMovement' => $debt->openingTransaction === null ? null : [
                'transactionId' => $debt->openingTransaction->id,
                'account' => [
                    'id' => $debt->openingTransaction->account->id,
                    'name' => $debt->openingTransaction->account->name,
                    'archived' => $debt->openingTransaction->account->archived_at !== null,
                ],
            ],
            'settlements' => $debt->settlements->map(
                fn (MoneyDebtSettlement $settlement): array => $this->settlement($settlement),
            )->values(),
        ];
    }

    /** @return array<string, mixed> */
    private function settlement(MoneyDebtSettlement $settlement): array
    {
        return [
            'id' => $settlement->id,
            'type' => $settlement->type->value,
            'amountMinor' => $settlement->amount_minor,
            'settledOn' => $settlement->settled_on->toDateString(),
            'note' => $settlement->note,
            'transactionId' => $settlement->transaction_id,
            'account' => $settlement->transaction === null ? null : [
                'id' => $settlement->transaction->account->id,
                'name' => $settlement->transaction->account->name,
                'archived' => $settlement->transaction->account->archived_at !== null,
            ],
        ];
    }
}
