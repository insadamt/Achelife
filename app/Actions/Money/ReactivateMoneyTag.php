<?php

namespace App\Actions\Money;

use App\Models\MoneyTag;

class ReactivateMoneyTag
{
    public function execute(MoneyTag $tag): MoneyTag
    {
        $tag->update(['archived_at' => null]);

        return $tag->refresh();
    }
}
