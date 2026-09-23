<?php

namespace App\Services\Money;

use App\Enums\MoneyDebtDirection;
use App\Enums\MoneyDebtSettlementType;
use App\Models\MoneyTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;

class MoneyDebtStatistics
{
    /** @return array<string, mixed> */
    public function summarize(User $user, ?string $currency, ?int $accountId, ?CarbonImmutable $start, CarbonImmutable $end, CarbonImmutable $today): array
    {
        $summary = $this->emptySummary($accountId !== null);
        if ($currency === null) {
            return $summary;
        }

        $debts = $user->moneyDebts()
            ->where('currency', $currency)
            ->with(['openingTransaction', 'settlements.transaction'])
            ->get();

        foreach ($debts as $debt) {
            $remaining = $debt->remainingAmountMinor();
            if ($remaining > 0) {
                $positionKey = $debt->direction === MoneyDebtDirection::Payable ? 'payableMinor' : 'receivableMinor';
                $summary['position'][$positionKey] += $remaining;
                if ($debt->due_on !== null && $debt->due_on->isBefore($today)) {
                    $summary['position']['overdueMinor'] += $remaining;
                    $summary['position']['overdueCount']++;
                }
            }

            if ($this->isInPeriod($debt->opened_on, $start, $end) && $this->matchesAccount($debt->openingTransaction, $accountId)) {
                $activityKey = $debt->direction === MoneyDebtDirection::Payable ? 'borrowedMinor' : 'lentMinor';
                $summary['activity'][$activityKey] += $debt->original_amount_minor;
            }

            foreach ($debt->settlements as $settlement) {
                if (! $this->isInPeriod($settlement->settled_on, $start, $end)) {
                    continue;
                }

                if ($settlement->type === MoneyDebtSettlementType::Repayment && $this->matchesAccount($settlement->transaction, $accountId)) {
                    $activityKey = $debt->direction === MoneyDebtDirection::Payable ? 'repaidMinor' : 'collectedMinor';
                    $summary['activity'][$activityKey] += $settlement->amount_minor;
                }

                if ($settlement->type === MoneyDebtSettlementType::Forgiveness && $accountId === null) {
                    $activityKey = $debt->direction === MoneyDebtDirection::Payable ? 'payableForgivenMinor' : 'receivableForgivenMinor';
                    $summary['activity'][$activityKey] += $settlement->amount_minor;
                }
            }
        }

        return $summary;
    }

    /** @return array<string, mixed> */
    private function emptySummary(bool $positionIsCurrencyWide): array
    {
        return [
            'positionIsCurrencyWide' => $positionIsCurrencyWide,
            'position' => ['payableMinor' => 0, 'receivableMinor' => 0, 'overdueMinor' => 0, 'overdueCount' => 0],
            'activity' => [
                'borrowedMinor' => 0,
                'lentMinor' => 0,
                'repaidMinor' => 0,
                'collectedMinor' => 0,
                'payableForgivenMinor' => 0,
                'receivableForgivenMinor' => 0,
            ],
        ];
    }

    private function isInPeriod(CarbonImmutable $date, ?CarbonImmutable $start, CarbonImmutable $end): bool
    {
        return ($start === null || ! $date->isBefore($start)) && ! $date->isAfter($end);
    }

    private function matchesAccount(?MoneyTransaction $transaction, ?int $accountId): bool
    {
        return $accountId === null || $transaction?->account_id === $accountId || $transaction?->destination_account_id === $accountId;
    }
}
