<?php

namespace App\Http\Controllers;

use App\Actions\Money\DeleteMoneyDebtSettlement;
use App\Actions\Money\RecordMoneyDebtRepayment;
use App\Data\Money\MoneyDebtRepaymentData;
use App\Http\Requests\StoreMoneyDebtRepaymentRequest;
use App\Models\MoneyDebt;
use App\Models\MoneyDebtSettlement;
use App\Support\Money\MoneyAmount;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyDebtRepaymentController extends Controller
{
    public function store(
        StoreMoneyDebtRepaymentRequest $request,
        MoneyDebt $debt,
        RecordMoneyDebtRepayment $record,
        MoneyAmount $amount,
    ): RedirectResponse {
        Gate::authorize('update', $debt);
        $validated = $request->validated();

        $record->execute($debt, new MoneyDebtRepaymentData(
            amountMinor: $amount->toMinorUnits($validated['amount']),
            accountId: (int) $validated['account_id'],
            settledOn: CarbonImmutable::parse($validated['settled_on']),
            note: $validated['note'] ?? null,
        ));

        return back();
    }

    public function destroy(MoneyDebtSettlement $settlement, DeleteMoneyDebtSettlement $delete): RedirectResponse
    {
        Gate::authorize('delete', $settlement);
        $delete->execute($settlement);

        return back();
    }
}
