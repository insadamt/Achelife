<?php

namespace App\Policies;

use App\Models\MoneySubcategory;
use App\Models\User;

class MoneySubcategoryPolicy
{
    public function update(User $user, MoneySubcategory $subcategory): bool
    {
        return $subcategory->user_id === $user->id;
    }

    public function delete(User $user, MoneySubcategory $subcategory): bool
    {
        return $subcategory->user_id === $user->id;
    }
}
