<?php

namespace App\Policies;

use App\Models\MoneyMerchant;
use App\Models\User;

class MoneyMerchantPolicy
{
    public function update(User $user, MoneyMerchant $merchant): bool
    {
        return $merchant->user_id === $user->id;
    }

    public function delete(User $user, MoneyMerchant $merchant): bool
    {
        return $merchant->user_id === $user->id;
    }
}
