<?php

namespace App\Http\Controllers;

use App\Actions\Money\ArchiveMoneyCategory;
use App\Actions\Money\CreateMoneyCategory;
use App\Actions\Money\DeleteUnusedMoneyCategory;
use App\Actions\Money\ReactivateMoneyCategory;
use App\Actions\Money\UpdateMoneyCategory;
use App\Enums\MoneyCategoryType;
use App\Http\Requests\StoreMoneyCategoryRequest;
use App\Http\Requests\UpdateMoneyCategoryRequest;
use App\Models\MoneyCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyCategoryController extends Controller
{
    public function store(StoreMoneyCategoryRequest $request, CreateMoneyCategory $create): RedirectResponse
    {
        $create->execute($request->user(), $request->validated('name'), MoneyCategoryType::from($request->validated('type')));

        return back();
    }

    public function update(UpdateMoneyCategoryRequest $request, MoneyCategory $category, UpdateMoneyCategory $update): RedirectResponse
    {
        Gate::authorize('update', $category);
        $update->execute($category, $request->validated('name'));

        return back();
    }

    public function archive(MoneyCategory $category, ArchiveMoneyCategory $archive): RedirectResponse
    {
        Gate::authorize('update', $category);
        $archive->execute($category);

        return back();
    }

    public function reactivate(MoneyCategory $category, ReactivateMoneyCategory $reactivate): RedirectResponse
    {
        Gate::authorize('update', $category);
        $reactivate->execute($category);

        return back();
    }

    public function destroy(MoneyCategory $category, DeleteUnusedMoneyCategory $delete): RedirectResponse
    {
        Gate::authorize('delete', $category);
        $delete->execute($category);

        return back();
    }
}
