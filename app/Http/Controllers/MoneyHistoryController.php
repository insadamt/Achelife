<?php

namespace App\Http\Controllers;

use App\Actions\Money\EnsureDefaultMoneyCategories;
use App\Enums\MoneyTransactionType;
use App\Models\MoneyCategory;
use App\Models\MoneyTransaction;
use App\Support\Money\MoneyViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MoneyHistoryController extends Controller
{
    public function __invoke(Request $request, EnsureDefaultMoneyCategories $ensureDefaults, MoneyViewDataFactory $factory): Response
    {
        $user = $request->user();
        $ensureDefaults->execute($user);
        $filters = $request->validate([
            'type' => ['nullable', Rule::enum(MoneyTransactionType::class)],
            'account' => ['nullable', 'integer'],
            'category' => ['nullable', 'integer'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'search' => ['nullable', 'string', 'max:120'],
        ]);
        $query = MoneyTransaction::query()
            ->where('user_id', $user->id)
            ->with(['account', 'destinationAccount', 'category', 'subcategory']);
        $this->applyFilters($query, $filters);
        $transactions = $query->orderByDesc('transaction_date')->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(30)->withQueryString()->through(fn (MoneyTransaction $transaction) => $factory->transaction($transaction));
        $categories = $user->moneyCategories()->with(['subcategories' => fn ($query) => $query->orderBy('name')])
            ->withCount('transactions')->orderBy('type')->orderBy('name')->get();

        return Inertia::render('money/History', [
            'today' => CarbonImmutable::today()->toDateString(),
            'transactions' => $transactions,
            'accounts' => $user->moneyAccounts()->orderBy('name')->get(['id', 'name', 'currency', 'archived_at']),
            'categories' => $categories->map(fn (MoneyCategory $category) => $factory->category($category)),
            'filters' => $filters,
        ]);
    }

    /** @param array<string, mixed> $filters */
    private function applyFilters(Builder $query, array $filters): void
    {
        $query->when($filters['type'] ?? null, fn (Builder $builder, string $type) => $builder->where('type', $type));
        $query->when($filters['account'] ?? null, fn (Builder $builder, int|string $id) => $builder->where(
            fn (Builder $accounts) => $accounts->where('account_id', $id)->orWhere('destination_account_id', $id),
        ));
        $query->when($filters['category'] ?? null, fn (Builder $builder, int|string $id) => $builder->where('category_id', $id));
        $query->when($filters['from'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('transaction_date', '>=', $date));
        $query->when($filters['to'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('transaction_date', '<=', $date));
        $query->when($filters['search'] ?? null, function (Builder $builder, string $search): void {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $pattern = "%{$escaped}%";
            $builder->where(function (Builder $matches) use ($pattern): void {
                $matches->where('note', 'like', $pattern)
                    ->orWhereHas('category', fn (Builder $category) => $category->where('name', 'like', $pattern))
                    ->orWhereHas('subcategory', fn (Builder $subcategory) => $subcategory->where('name', 'like', $pattern));
            });
        });
    }
}
