<?php

namespace App\Actions\Money;

use App\Models\MoneyAccount;
use App\Models\User;

class CreateMoneyAccount
{
    public function execute(User $user, string $name, string $currency, int $initialBalanceMinor): MoneyAccount
    {
        $themeIndex = $user->moneyAccounts()->count() % 6;

        return $user->moneyAccounts()->create([
            'name' => $name,
            'currency' => strtoupper($currency),
            'initial_balance_minor' => $initialBalanceMinor,
            'theme_index' => $themeIndex,
            'visual_identifier' => (string) random_int(1000, 9999),
        ]);
    }
}
