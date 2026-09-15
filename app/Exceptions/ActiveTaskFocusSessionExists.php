<?php

namespace App\Exceptions;

use App\Models\TaskFocusSession;
use RuntimeException;

class ActiveTaskFocusSessionExists extends RuntimeException
{
    public function __construct(public readonly TaskFocusSession $session)
    {
        parent::__construct('Another Task already has an active Focus Session.');
    }
}
