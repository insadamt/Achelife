<?php

namespace App\Policies;

use App\Models\Season;
use App\Models\User;

class SeasonPolicy
{
    public function view(User $user, Season $season): bool
    {
        return $user->is($season->user);
    }

    public function acknowledgeIntroduction(User $user, Season $season): bool
    {
        return $user->is($season->user);
    }

    public function createObjective(User $user, Season $season): bool
    {
        return $this->view($user, $season);
    }
}
