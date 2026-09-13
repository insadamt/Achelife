<?php

namespace App\Actions\Money;

use App\Models\MoneyTag;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteUnusedMoneyTag
{
    public function execute(MoneyTag $tag): void
    {
        DB::transaction(function () use ($tag): void {
            $lockedTag = MoneyTag::query()->lockForUpdate()->findOrFail($tag->id);

            if ($lockedTag->transactions()->exists()) {
                throw ValidationException::withMessages([
                    'tag' => 'Tags with transaction history cannot be deleted. Archive this Tag instead.',
                ]);
            }

            $lockedTag->delete();
        }, 3);
    }
}
