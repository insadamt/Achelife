<?php

namespace App\Actions\Money;

use App\Models\MoneyTag;
use App\Support\Money\MoneyTagName;
use Illuminate\Validation\ValidationException;

class UpdateMoneyTag
{
    public function __construct(private readonly MoneyTagName $tagName) {}

    public function execute(MoneyTag $tag, string $name, string $color): MoneyTag
    {
        $displayName = $this->tagName->display($name);
        $normalizedName = $this->tagName->normalized($name);
        $duplicateExists = MoneyTag::query()
            ->where('user_id', $tag->user_id)
            ->where('normalized_name', $normalizedName)
            ->whereKeyNot($tag->id)
            ->exists();

        if ($duplicateExists) {
            throw ValidationException::withMessages(['name' => 'A Tag with this name already exists.']);
        }

        $tag->update(['name' => $displayName, 'normalized_name' => $normalizedName, 'color' => strtoupper($color)]);

        return $tag->refresh();
    }
}
