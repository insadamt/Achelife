<?php

namespace App\Http\Controllers;

use App\Actions\Money\ArchiveMoneyAccount;
use App\Actions\Money\CreateMoneyAccount;
use App\Actions\Money\DeleteUnusedMoneyAccount;
use App\Actions\Money\ReactivateMoneyAccount;
use App\Actions\Money\UpdateMoneyAccount;
use App\Http\Requests\StoreMoneyAccountRequest;
use App\Http\Requests\UpdateMoneyAccountRequest;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneyTransaction;
use App\Services\Calendar\UserCalendar;
use App\Services\Money\AccountBalanceCalculator;
use App\Support\Money\MoneyAmount;
use App\Support\Money\MoneyViewDataFactory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class MoneyAccountController extends Controller
{
    public function show(Request $request, MoneyAccount $account, AccountBalanceCalculator $calculator, MoneyViewDataFactory $factory, UserCalendar $calendar): Response
    {
        Gate::authorize('view', $account);
        $account->loadCount(['transactions', 'incomingTransfers']);
        $balances = $calculator->forAccounts($request->user(), collect([$account]));
        $transactions = $request->user()->moneyTransactions()
            ->where(fn ($query) => $query->where('account_id', $account->id)->orWhere('destination_account_id', $account->id))
            ->with(['account', 'destinationAccount', 'category', 'subcategory', 'subscriptionOccurrence.subscription'])
            ->orderByDesc('transaction_date')->orderByDesc('created_at')->orderByDesc('id')->limit(30)->get();
        $categories = $request->user()->moneyCategories()
            ->with(['subcategories' => fn ($query) => $query->orderBy('name')])
            ->withCount('transactions')->orderBy('type')->orderBy('name')->get();
        $activeAccounts = $request->user()->moneyAccounts()->whereNull('archived_at')->orderBy('name')->get();

        return Inertia::render('money/accounts/Show', [
            'today' => $calendar->today($request->user())->toDateString(),
            'account' => $factory->account($account, $balances[$account->id]),
            'accounts' => $activeAccounts->map(fn ($item) => $factory->account($item, 0)),
            'categories' => $categories->map(fn (MoneyCategory $category) => $factory->category($category)),
            'transactions' => $transactions->map(fn (MoneyTransaction $transaction) => $factory->transaction($transaction)),
        ]);
    }

    public function store(StoreMoneyAccountRequest $request, CreateMoneyAccount $create, MoneyAmount $amount): RedirectResponse
    {
        $create->execute($request->user(), $request->validated('name'), $request->validated('currency'), $amount->toMinorUnits($request->validated('initial_balance'), true));

        return back();
    }

    public function update(UpdateMoneyAccountRequest $request, MoneyAccount $account, UpdateMoneyAccount $update, MoneyAmount $amount): RedirectResponse
    {
        Gate::authorize('update', $account);
        $update->execute($account, $request->validated('name'), $request->validated('currency'), $amount->toMinorUnits($request->validated('initial_balance'), true));

        return back();
    }

    public function archive(MoneyAccount $account, ArchiveMoneyAccount $archive): RedirectResponse
    {
        Gate::authorize('update', $account);
        $archive->execute($account);

        return redirect()->route('money.index');
    }

    public function reactivate(MoneyAccount $account, ReactivateMoneyAccount $reactivate): RedirectResponse
    {
        Gate::authorize('update', $account);
        $reactivate->execute($account);

        return back();
    }

    public function destroy(MoneyAccount $account, DeleteUnusedMoneyAccount $delete): RedirectResponse
    {
        Gate::authorize('delete', $account);
        $delete->execute($account);

        return redirect()->route('money.index');
    }
}
