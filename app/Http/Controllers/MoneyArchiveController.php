<?php

namespace App\Http\Controllers;

use App\Models\MoneyAccount;
use App\Models\MoneyCategory;
use App\Services\Money\AccountBalanceCalculator;
use App\Support\Money\MoneyPresetPack;
use App\Support\Money\MoneyViewDataFactory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MoneyArchiveController extends Controller
{
    public function accounts(Request $request, AccountBalanceCalculator $calculator, MoneyViewDataFactory $factory): Response
    {
        $accounts = $request->user()->moneyAccounts()
            ->whereNotNull('archived_at')
            ->withCount(['transactions', 'incomingTransfers'])
            ->latest('archived_at')
            ->get();
        $balances = $calculator->forAccounts($request->user(), $accounts);

        return Inertia::render('money/accounts/Archived', [
            'accounts' => $accounts->map(fn (MoneyAccount $account) => $factory->account($account, $balances[$account->id])),
        ]);
    }

    public function categories(Request $request, MoneyViewDataFactory $factory, MoneyPresetPack $presetPack): Response
    {
        $categories = $request->user()->moneyCategories()
            ->with(['subcategories' => fn ($query) => $query->withCount('transactions')->orderBy('name')])
            ->withCount('transactions')
            ->orderBy('type')->orderBy('name')->get();

        return Inertia::render('money/categories/Index', [
            'categories' => $categories->map(fn (MoneyCategory $category) => $factory->category($category)),
            'presetPack' => $presetPack->preview($request->user()),
        ]);
    }
}
