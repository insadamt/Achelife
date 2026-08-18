<?php

namespace App\Actions\Constitution;

use App\Models\Law;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ArchiveLaw
{
    public function execute(Law $law): Law
    {
        return DB::transaction(function () use ($law): Law {
            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($law->id);

            if ($lockedLaw->archived_at !== null) {
                throw ValidationException::withMessages(['law' => 'This Law is already archived.']);
            }

            $lockedLaw->update(['archived_at' => now()]);

            return $lockedLaw->refresh();
        }, 3);
    }
}
