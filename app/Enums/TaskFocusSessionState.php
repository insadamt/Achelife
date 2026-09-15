<?php

namespace App\Enums;

enum TaskFocusSessionState: string
{
    case Running = 'running';
    case Paused = 'paused';
    case Completed = 'completed';
}
