<?php

namespace App\Actions\Money;

use App\Models\MoneyTag;
use App\Models\User;
use App\Support\Money\MoneyTagName;
use Illuminate\Validation\ValidationException;

class CreateMoneyTag
{
    public function __construct(private readonly MoneyTagName $tagName) {}

    public function execute(User $user, string $name, string $color): MoneyTag
    {
        $displayName = $this->tagName->display($name);
        $normalizedName = $this->tagName->normalized($name);

        if ($user->moneyTags()->where('normalized_name', $normalizedName)->exists()) {
            throw ValidationException::withMessages(['name' => 'A Tag with this name already exists.']);
        }

        return $user->moneyTags()->create([
            'name' => $displayName,
            'normalized_name' => $normalizedName,
            'color' => strtoupper($color),
        ]);
    }
}
