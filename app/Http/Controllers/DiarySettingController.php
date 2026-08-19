<?php

namespace App\Http\Controllers;

use App\Models\DiarySetting;
use App\Support\Diary\DiaryLanguageCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DiarySettingController extends Controller
{
    public function update(Request $request, DiaryLanguageCatalog $catalog): RedirectResponse
    {
        $allowedCodes = collect($catalog->all())->pluck('code')->all();
        $validated = $request->validate([
            'languages' => ['present', 'array', 'min:1', 'max:12'],
            'languages.*' => ['string', 'distinct', Rule::in($allowedCodes)],
        ]);

        DiarySetting::query()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['languages' => array_values($validated['languages'])],
        );

        return back();
    }
}
