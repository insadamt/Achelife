<?php

namespace App\Actions\Constitution;

use App\Enums\LawSeverity;
use App\Models\Law;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateLaw
{
    public function execute(Law $law, string $name, LawSeverity $severity): Law
    {
        return DB::transaction(function () use ($law, $name, $severity): Law {
            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($law->id);

            if ($lockedLaw->archived_at !== null) {
                throw ValidationException::withMessages(['law' => 'Archived Laws are permanently read-only.']);
            }

            $lockedLaw->update(['name' => $name, 'severity' => $severity]);

            return $lockedLaw->refresh();
        }, 3);
    }
}
