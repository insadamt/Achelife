<?php

namespace App\Actions\Money;

use App\Models\MoneyTag;

class ArchiveMoneyTag
{
    public function execute(MoneyTag $tag): MoneyTag
    {
        $tag->update(['archived_at' => now()]);

        return $tag->refresh();
    }
}
