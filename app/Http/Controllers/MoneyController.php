<?php

namespace App\Http\Controllers;

use App\Actions\Money\EnsureDefaultMoneyCategories;
use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Money\AccountBalanceCalculator;
use App\Support\Money\MoneyViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class MoneyController extends Controller
{
    public function index(
        Request $request,
        EnsureDefaultMoneyCategories $ensureDefaults,
        AccountBalanceCalculator $balanceCalculator,
        MoneyViewDataFactory $viewDataFactory,
    ): Response {
        $user = $request->user();
        $ensureDefaults->execute($user);
        $accounts = $user->moneyAccounts()
            ->whereNull('archived_at')
            ->withCount(['transactions', 'incomingTransfers'])
            ->orderBy('created_at')
            ->get();
        $balances = $balanceCalculator->forAccounts($user, $accounts);

        return Inertia::render('money/Index', [
            'today' => CarbonImmutable::today()->toDateString(),
            'accounts' => $accounts->map(fn (MoneyAccount $account) => $viewDataFactory->account($account, $balances[$account->id])),
            'totalsByCurrency' => $balanceCalculator->totalsByCurrency($accounts, $balances),
            'categories' => $this->categories($user, $viewDataFactory),
            'recentTransactions' => $this->transactions($user)->limit(8)->get()->map(
                fn (MoneyTransaction $transaction) => $viewDataFactory->transaction($transaction),
            ),
        ]);
    }

    /** @return Collection<int, array<string, mixed>> */
    private function categories(User $user, MoneyViewDataFactory $viewDataFactory): Collection
    {
        return $user->moneyCategories()
            ->with(['subcategories' => fn ($query) => $query->orderBy('name')])
            ->withCount('transactions')
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->map(fn (MoneyCategory $category) => $viewDataFactory->category($category));
    }

    /** @return HasMany<MoneyTransaction, User> */
    private function transactions(User $user): HasMany
    {
        return $user->moneyTransactions()
            ->with(['account', 'destinationAccount', 'category', 'subcategory'])
            ->orderByDesc('transaction_date')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }
}
