<?php

namespace App\Http\Controllers;

use App\Actions\Constitution\CreateLaw;
use App\Actions\Constitution\DeleteUnusedLaw;
use App\Actions\Constitution\UpdateLaw;
use App\Enums\LawSeverity;
use App\Http\Requests\StoreLawRequest;
use App\Http\Requests\UpdateLawRequest;
use App\Models\Law;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class LawController extends Controller
{
    public function store(StoreLawRequest $request, CreateLaw $createLaw): RedirectResponse
    {
        $createLaw->execute(
            $request->user(),
            $request->validated('name'),
            LawSeverity::from($request->validated('severity')),
        );

        return back();
    }

    public function update(UpdateLawRequest $request, Law $law, UpdateLaw $updateLaw): RedirectResponse
    {
        $updateLaw->execute(
            $law,
            $request->validated('name'),
            LawSeverity::from($request->validated('severity')),
        );

        return back();
    }

    public function destroy(Request $request, Law $law, DeleteUnusedLaw $deleteLaw): RedirectResponse
    {
        Gate::authorize('delete', $law);
        $deleteLaw->execute($law);

        return back();
    }
}
