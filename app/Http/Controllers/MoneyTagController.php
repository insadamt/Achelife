<?php

namespace App\Http\Controllers;

use App\Actions\Money\ArchiveMoneyTag;
use App\Actions\Money\CreateMoneyTag;
use App\Actions\Money\DeleteUnusedMoneyTag;
use App\Actions\Money\ReactivateMoneyTag;
use App\Actions\Money\UpdateMoneyTag;
use App\Http\Requests\StoreMoneyTagRequest;
use App\Http\Requests\UpdateMoneyTagRequest;
use App\Models\MoneyTag;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyTagController extends Controller
{
    public function store(StoreMoneyTagRequest $request, CreateMoneyTag $create): RedirectResponse
    {
        $create->execute($request->user(), $request->validated('name'), $request->validated('color'));

        return back();
    }

    public function update(UpdateMoneyTagRequest $request, MoneyTag $tag, UpdateMoneyTag $update): RedirectResponse
    {
        Gate::authorize('update', $tag);
        $update->execute($tag, $request->validated('name'), $request->validated('color'));

        return back();
    }

    public function archive(MoneyTag $tag, ArchiveMoneyTag $archive): RedirectResponse
    {
        Gate::authorize('update', $tag);
        $archive->execute($tag);

        return back();
    }

    public function reactivate(MoneyTag $tag, ReactivateMoneyTag $reactivate): RedirectResponse
    {
        Gate::authorize('update', $tag);
        $reactivate->execute($tag);

        return back();
    }

    public function destroy(MoneyTag $tag, DeleteUnusedMoneyTag $delete): RedirectResponse
    {
        Gate::authorize('delete', $tag);
        $delete->execute($tag);

        return back();
    }
}
