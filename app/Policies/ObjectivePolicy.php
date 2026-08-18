<?php

namespace App\Policies;

use App\Models\Objective;
use App\Models\User;

class ObjectivePolicy
{
    public function view(User $user, Objective $objective): bool
    {
        return $user->id === $objective->user_id;
    }

    public function update(User $user, Objective $objective): bool
    {
        return $this->view($user, $objective);
    }

    public function delete(User $user, Objective $objective): bool
    {
        return $this->view($user, $objective);
    }

    public function toggle(User $user, Objective $objective): bool
    {
        return $this->view($user, $objective);
    }
}
