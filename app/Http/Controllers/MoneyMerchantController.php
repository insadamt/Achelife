<?php

namespace App\Http\Controllers;

use App\Actions\Money\ArchiveMoneyMerchant;
use App\Actions\Money\CreateMoneyMerchant;
use App\Actions\Money\DeleteUnusedMoneyMerchant;
use App\Actions\Money\ReactivateMoneyMerchant;
use App\Actions\Money\UpdateMoneyMerchant;
use App\Http\Requests\StoreMoneyMerchantRequest;
use App\Http\Requests\UpdateMoneyMerchantRequest;
use App\Models\MoneyMerchant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyMerchantController extends Controller
{
    public function store(StoreMoneyMerchantRequest $request, CreateMoneyMerchant $create): RedirectResponse
    {
        $create->execute($request->user(), $request->validated('name'));

        return back();
    }

    public function update(UpdateMoneyMerchantRequest $request, MoneyMerchant $merchant, UpdateMoneyMerchant $update): RedirectResponse
    {
        Gate::authorize('update', $merchant);
        $update->execute($merchant, $request->validated('name'));

        return back();
    }

    public function archive(MoneyMerchant $merchant, ArchiveMoneyMerchant $archive): RedirectResponse
    {
        Gate::authorize('update', $merchant);
        $archive->execute($merchant);

        return back();
    }

    public function reactivate(MoneyMerchant $merchant, ReactivateMoneyMerchant $reactivate): RedirectResponse
    {
        Gate::authorize('update', $merchant);
        $reactivate->execute($merchant);

        return back();
    }

    public function destroy(MoneyMerchant $merchant, DeleteUnusedMoneyMerchant $delete): RedirectResponse
    {
        Gate::authorize('delete', $merchant);
        $delete->execute($merchant);

        return back();
    }
}
