<?php

namespace App\Policies;

use App\Models\Person;
use App\Models\User;

class PersonPolicy
{
    public function view(User $user, Person $person): bool
    {
        return $user->is($person->user);
    }

    public function update(User $user, Person $person): bool
    {
        return $this->view($user, $person);
    }

    public function delete(User $user, Person $person): bool
    {
        return $this->view($user, $person);
    }
}
