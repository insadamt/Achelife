<?php

namespace App\Http\Controllers;

use App\Models\MoneyDebt;
use App\Services\Calendar\UserCalendar;
use App\Support\Money\MoneyDebtViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyDebtPageController extends Controller
{
    public function __invoke(
        Request $request,
        UserCalendar $calendar,
        MoneyDebtViewDataFactory $viewDataFactory,
    ): Response {
        $user = $request->user();
        $today = $calendar->today($user);
        $debts = $user->moneyDebts()
            ->with([
                'person',
                'openingTransaction.account',
                'settlements' => fn ($query) => $query->orderByDesc('settled_on')->orderByDesc('id'),
                'settlements.transaction.account',
            ])
            ->orderByRaw('due_on is null')
            ->orderBy('due_on')
            ->orderByDesc('opened_on')
            ->get();
        $debtData = $debts->map(fn (MoneyDebt $debt): array => $viewDataFactory->debt($debt, $today));

        return Inertia::render('money/debts/Index', [
            'today' => $today->toDateString(),
            'accounts' => $user->moneyAccounts()->whereNull('archived_at')->orderBy('name')->get(['id', 'name', 'currency']),
            'people' => $user->people()->whereNull('archived_at')->orderBy('name')->get(['id', 'name', 'nickname']),
            'debts' => $debtData,
            'totalsByCurrency' => $this->totalsByCurrency($debtData->all()),
        ]);
    }

    /** @param list<array<string, mixed>> $debts
     * @return array<string, array{payable: int, receivable: int}>
     */
    private function totalsByCurrency(array $debts): array
    {
        $totals = [];

        foreach ($debts as $debt) {
            if ($debt['remainingAmountMinor'] === 0) {
                continue;
            }

            $totals[$debt['currency']] ??= ['payable' => 0, 'receivable' => 0];
            $totals[$debt['currency']][$debt['direction']] += $debt['remainingAmountMinor'];
        }

        ksort($totals);

        return $totals;
    }
}
