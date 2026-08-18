<?php

namespace App\Policies;

use App\Models\Habit;
use App\Models\User;

class HabitPolicy
{
    public function view(User $user, Habit $habit): bool
    {
        return $user->is($habit->user);
    }

    public function update(User $user, Habit $habit): bool
    {
        return $user->is($habit->user) && $habit->archived_at === null && $habit->deleted_at === null;
    }

    public function archive(User $user, Habit $habit): bool
    {
        return $this->update($user, $habit);
    }

    public function delete(User $user, Habit $habit): bool
    {
        return $this->update($user, $habit);
    }
}
