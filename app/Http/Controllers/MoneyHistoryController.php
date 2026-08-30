<?php

namespace App\Http\Controllers;

use App\Enums\MoneyTransactionType;
use App\Models\MoneyCategory;
use App\Models\MoneyTransaction;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Support\Money\MoneyPresetPack;
use App\Support\Money\MoneyViewDataFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MoneyHistoryController extends Controller
{
    public function __invoke(Request $request, MoneyViewDataFactory $factory, UserCalendar $calendar): Response
    {
        $user = $request->user();
        $filters = $request->validate([
            'type' => ['nullable', Rule::enum(MoneyTransactionType::class)],
            'account' => ['nullable', 'integer'],
            'category' => ['nullable', 'integer'],
            'subcategory' => ['nullable', 'integer'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'search' => ['nullable', 'string', 'max:120'],
        ]);
        $query = MoneyTransaction::query()
            ->where('user_id', $user->id)
            ->with(['account', 'destinationAccount', 'category', 'subcategory', 'subscriptionOccurrence.subscription']);
        $this->applyFilters($query, $filters, $user);
        $transactions = $query->orderByDesc('transaction_date')->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(30)->withQueryString()->through(fn (MoneyTransaction $transaction) => $factory->transaction($transaction));
        $categories = $user->moneyCategories()->with(['subcategories' => fn ($query) => $query->orderBy('name')])
            ->withCount('transactions')->orderBy('type')->orderBy('name')->get();

        return Inertia::render('money/History', [
            'today' => $calendar->today($user)->toDateString(),
            'transactions' => $transactions,
            'accounts' => $user->moneyAccounts()->orderBy('name')->get(['id', 'name', 'currency', 'archived_at']),
            'categories' => $categories->map(fn (MoneyCategory $category) => $factory->category($category)),
            'filters' => $filters,
        ]);
    }

    /** @param array<string, mixed> $filters */
    private function applyFilters(Builder $query, array $filters, User $user): void
    {
        $query->when($filters['type'] ?? null, fn (Builder $builder, string $type) => $builder->where('type', $type));
        $query->when($filters['account'] ?? null, fn (Builder $builder, int|string $id) => $builder->where(
            fn (Builder $accounts) => $accounts->where('account_id', $id)->orWhere('destination_account_id', $id),
        ));
        $this->applyCategoryFilters($query, $filters, $user);
        $query->when($filters['from'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('transaction_date', '>=', $date));
        $query->when($filters['to'] ?? null, fn (Builder $builder, string $date) => $builder->whereDate('transaction_date', '<=', $date));
        $query->when($filters['search'] ?? null, function (Builder $builder, string $search): void {
            $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $search);
            $pattern = "%{$escaped}%";
            $matchesTransferFeeLabel = stripos('Financial Bank Fees', $search) !== false;
            $builder->where(function (Builder $matches) use ($pattern, $matchesTransferFeeLabel): void {
                $matches->where('note', 'like', $pattern)
                    ->orWhereHas('category', fn (Builder $category) => $category->where('name', 'like', $pattern))
                    ->orWhereHas('subcategory', fn (Builder $subcategory) => $subcategory->where('name', 'like', $pattern));
                if ($matchesTransferFeeLabel) {
                    $matches->orWhere(fn (Builder $fees) => $fees->where('type', 'transfer')->where('fee_minor', '>', 0));
                }
            });
        });
    }

    /** @param array<string, mixed> $filters */
    private function applyCategoryFilters(Builder $query, array $filters, User $user): void
    {
        $category = isset($filters['category'])
            ? $user->moneyCategories()->find($filters['category'])
            : null;
        $subcategory = isset($filters['subcategory'])
            ? $user->moneySubcategories()->find($filters['subcategory'])
            : null;

        if ($category) {
            $query->where(function (Builder $matches) use ($category): void {
                $matches->where('category_id', $category->id);
                if ($category->preset_key === MoneyPresetPack::FINANCIAL_CATEGORY_KEY) {
                    $matches->orWhere(fn (Builder $fees) => $fees->where('type', 'transfer')->where('fee_minor', '>', 0));
                }
            });
        }

        if ($subcategory && ($category === null || $subcategory->category_id === $category->id)) {
            $query->where(function (Builder $matches) use ($subcategory): void {
                $matches->where('subcategory_id', $subcategory->id);
                if ($subcategory->preset_key === MoneyPresetPack::BANK_FEES_SUBCATEGORY_KEY) {
                    $matches->orWhere(fn (Builder $fees) => $fees->where('type', 'transfer')->where('fee_minor', '>', 0));
                }
            });
        }
    }
}
