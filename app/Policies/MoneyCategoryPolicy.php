<?php

namespace App\Policies;

use App\Models\MoneyCategory;
use App\Models\User;

class MoneyCategoryPolicy
{
    public function update(User $user, MoneyCategory $category): bool
    {
        return $category->user_id === $user->id;
    }

    public function delete(User $user, MoneyCategory $category): bool
    {
        return $category->user_id === $user->id;
    }
}
