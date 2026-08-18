<?php

namespace App\Actions\Constitution;

use App\Models\Law;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteUnusedLaw
{
    public function execute(Law $law): void
    {
        DB::transaction(function () use ($law): void {
            $lockedLaw = Law::query()->lockForUpdate()->findOrFail($law->id);

            if ($lockedLaw->violations()->exists()) {
                throw ValidationException::withMessages([
                    'law' => 'A Law with violation history cannot be deleted. Archive it instead.',
                ]);
            }

            $lockedLaw->delete();
        }, 3);
    }
}
