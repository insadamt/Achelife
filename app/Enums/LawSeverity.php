<?php

namespace App\Enums;

enum LawSeverity: string
{
    case Minor = 'minor';
    case Major = 'major';
    case Critical = 'critical';

    public function basePenalty(): int
    {
        return match ($this) {
            self::Minor => -10,
            self::Major => -50,
            self::Critical => -100,
        };
    }
}
