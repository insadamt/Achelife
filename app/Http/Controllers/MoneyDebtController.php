<?php

namespace App\Http\Controllers;

use App\Actions\Money\DeleteUnusedMoneyDebt;
use App\Actions\Money\OpenMoneyDebt;
use App\Data\Money\MoneyDebtData;
use App\Enums\MoneyDebtDirection;
use App\Http\Requests\StoreMoneyDebtRequest;
use App\Models\MoneyDebt;
use App\Support\Money\MoneyAmount;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyDebtController extends Controller
{
    public function store(StoreMoneyDebtRequest $request, OpenMoneyDebt $open, MoneyAmount $amount): RedirectResponse
    {
        $validated = $request->validated();
        $createPerson = (bool) $validated['create_person'];
        $trackAccount = (bool) $validated['track_account'];

        $open->execute($request->user(), new MoneyDebtData(
            direction: MoneyDebtDirection::from($validated['direction']),
            amountMinor: $amount->toMinorUnits($validated['amount']),
            personId: $createPerson ? null : (int) $validated['person_id'],
            personName: $createPerson ? $validated['person_name'] : null,
            personNickname: $createPerson ? ($validated['person_nickname'] ?? null) : null,
            accountId: $trackAccount ? (int) $validated['account_id'] : null,
            currency: $validated['currency'],
            openedOn: CarbonImmutable::parse($validated['opened_on']),
            dueOn: empty($validated['due_on']) ? null : CarbonImmutable::parse($validated['due_on']),
            note: $validated['note'] ?? null,
        ));

        return back();
    }

    public function destroy(MoneyDebt $debt, DeleteUnusedMoneyDebt $delete): RedirectResponse
    {
        Gate::authorize('delete', $debt);
        $delete->execute($debt);

        return back();
    }
}
