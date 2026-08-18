<?php

namespace App\Http\Controllers;

use App\Actions\Money\ArchiveMoneySubcategory;
use App\Actions\Money\CreateMoneySubcategory;
use App\Actions\Money\DeleteUnusedMoneySubcategory;
use App\Actions\Money\ReactivateMoneySubcategory;
use App\Actions\Money\UpdateMoneySubcategory;
use App\Http\Requests\StoreMoneySubcategoryRequest;
use App\Http\Requests\UpdateMoneySubcategoryRequest;
use App\Models\MoneySubcategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class MoneySubcategoryController extends Controller
{
    public function store(StoreMoneySubcategoryRequest $request, CreateMoneySubcategory $create): RedirectResponse
    {
        $category = $request->user()->moneyCategories()->find($request->validated('category_id'));
        if (! $category) {
            throw ValidationException::withMessages(['category_id' => 'The selected Category does not belong to you.']);
        }
        $create->execute($category, $request->validated('name'));

        return back();
    }

    public function update(UpdateMoneySubcategoryRequest $request, MoneySubcategory $subcategory, UpdateMoneySubcategory $update): RedirectResponse
    {
        Gate::authorize('update', $subcategory);
        $update->execute($subcategory, $request->validated('name'));

        return back();
    }

    public function archive(MoneySubcategory $subcategory, ArchiveMoneySubcategory $archive): RedirectResponse
    {
        Gate::authorize('update', $subcategory);
        $archive->execute($subcategory);

        return back();
    }

    public function reactivate(MoneySubcategory $subcategory, ReactivateMoneySubcategory $reactivate): RedirectResponse
    {
        Gate::authorize('update', $subcategory);
        $reactivate->execute($subcategory);

        return back();
    }

    public function destroy(MoneySubcategory $subcategory, DeleteUnusedMoneySubcategory $delete): RedirectResponse
    {
        Gate::authorize('delete', $subcategory);
        $delete->execute($subcategory);

        return back();
    }
}
