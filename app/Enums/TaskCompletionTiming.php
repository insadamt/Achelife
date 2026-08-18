<?php

namespace App\Enums;

enum TaskCompletionTiming: string
{
    case Early = 'early';
    case OnTime = 'on_time';
    case Late = 'late';
}
