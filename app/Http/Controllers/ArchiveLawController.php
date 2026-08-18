<?php

namespace App\Http\Controllers;

use App\Actions\Constitution\ArchiveLaw;
use App\Models\Law;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class ArchiveLawController extends Controller
{
    public function __invoke(Law $law, ArchiveLaw $archiveLaw): RedirectResponse
    {
        Gate::authorize('update', $law);
        $archiveLaw->execute($law);

        return back();
    }
}
