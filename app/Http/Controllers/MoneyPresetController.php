<?php

namespace App\Http\Controllers;

use App\Actions\Money\InstallMoneyPresetPack;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MoneyPresetController extends Controller
{
    public function store(Request $request, InstallMoneyPresetPack $install): RedirectResponse
    {
        $result = $install->execute($request->user());

        return back()->with('status', $result->categoriesCreated + $result->subcategoriesCreated > 0
            ? "Installed {$result->categoriesCreated} Categories and {$result->subcategoriesCreated} Subcategories."
            : 'The Money preset pack is already complete.');
    }
}
