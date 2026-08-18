<?php

namespace App\Policies;

use App\Models\DiaryEntry;
use App\Models\User;

class DiaryEntryPolicy
{
    public function view(User $user, DiaryEntry $entry): bool
    {
        return $user->is($entry->user);
    }

    public function update(User $user, DiaryEntry $entry): bool
    {
        return $this->view($user, $entry);
    }
}
