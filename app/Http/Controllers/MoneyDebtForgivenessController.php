<?php

namespace App\Http\Controllers;

use App\Actions\Money\ForgiveMoneyDebtBalance;
use App\Models\MoneyDebt;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class MoneyDebtForgivenessController extends Controller
{
    public function __invoke(MoneyDebt $debt, ForgiveMoneyDebtBalance $forgive): RedirectResponse
    {
        Gate::authorize('update', $debt);
        $forgive->execute($debt);

        return back();
    }
}
