<?php

namespace App\Http\Controllers;

use App\Actions\Money\DeleteMoneyTransaction;
use App\Actions\Money\SaveMoneyTransaction;
use App\Data\Money\MoneyTransactionData;
use App\Enums\MoneyTransactionType;
use App\Http\Requests\StoreMoneyTransactionRequest;
use App\Http\Requests\UpdateMoneyTransactionRequest;
use App\Models\MoneyTransaction;
use App\Support\Money\MoneyAmount;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyTransactionController extends Controller
{
    public function store(StoreMoneyTransactionRequest $request, SaveMoneyTransaction $save, MoneyAmount $amount): RedirectResponse
    {
        $save->create($request->user(), $this->data($request->validated(), MoneyTransactionType::from($request->validated('type')), $amount));

        return back();
    }

    public function update(UpdateMoneyTransactionRequest $request, MoneyTransaction $transaction, SaveMoneyTransaction $save, MoneyAmount $amount): RedirectResponse
    {
        Gate::authorize('update', $transaction);
        $save->update($request->user(), $transaction, $this->data($request->validated(), $transaction->type, $amount));

        return back();
    }

    public function destroy(MoneyTransaction $transaction, DeleteMoneyTransaction $delete): RedirectResponse
    {
        Gate::authorize('delete', $transaction);
        $delete->execute($transaction);

        return back();
    }

    /** @param array<string, mixed> $validated */
    private function data(array $validated, MoneyTransactionType $type, MoneyAmount $amount): MoneyTransactionData
    {
        return new MoneyTransactionData(
            type: $type,
            amountMinor: $amount->toMinorUnits($validated['amount']),
            accountId: (int) $validated['account_id'],
            destinationAccountId: isset($validated['destination_account_id']) ? (int) $validated['destination_account_id'] : null,
            categoryId: isset($validated['category_id']) ? (int) $validated['category_id'] : null,
            subcategoryId: isset($validated['subcategory_id']) ? (int) $validated['subcategory_id'] : null,
            date: CarbonImmutable::parse($validated['date']),
            note: $validated['note'] ?? null,
            feeMinor: $amount->toMinorUnits($validated['fee'] ?? '0'),
        );
    }
}
