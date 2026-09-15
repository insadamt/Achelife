<?php

namespace App\Enums;

enum TaskFocusTransition: string
{
    case Pause = 'pause';
    case Resume = 'resume';
    case Stop = 'stop';
}
