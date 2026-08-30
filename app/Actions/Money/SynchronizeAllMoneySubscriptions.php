<?php

namespace App\Actions\Money;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class SynchronizeAllMoneySubscriptions
{
    public function __construct(private readonly SynchronizeMoneySubscriptions $synchronize) {}

    public function execute(): void
    {
        User::query()->whereHas('moneySubscriptions', fn ($query) => $query->whereIn('status', ['active', 'paused']))
            ->eachById(function (User $user): void {
                $lock = Cache::lock("achelife-account-write:{$user->id}", 300);

                if (! $lock->get()) {
                    return;
                }

                try {
                    $this->synchronize->execute($user);
                } finally {
                    $lock->release();
                }
            });
    }
}
