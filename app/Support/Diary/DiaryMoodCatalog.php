<?php

namespace App\Support\Diary;

use Illuminate\Validation\ValidationException;

class DiaryMoodCatalog
{
    /** @var array<string, list<string>> */
    private const GROUPS = [
        'happy' => ['joyful', 'excited', 'grateful', 'proud', 'hopeful'],
        'calm' => ['relaxed', 'peaceful', 'comfortable', 'content', 'focused'],
        'energetic' => ['motivated', 'inspired', 'productive', 'playful', 'confident'],
        'sad' => ['down', 'lonely', 'disappointed', 'hurt', 'empty'],
        'angry' => ['annoyed', 'frustrated', 'irritated', 'furious', 'resentful'],
        'anxious' => ['nervous', 'worried', 'stressed', 'afraid', 'overwhelmed'],
        'tired' => ['sleepy', 'exhausted', 'drained', 'bored', 'lazy'],
        'confused' => ['unsure', 'lost', 'distracted', 'surprised', 'curious'],
    ];

    /** @return array<string, list<string>> */
    public function all(): array
    {
        return self::GROUPS;
    }

    public function assertPair(?string $group, ?string $mood): void
    {
        if ($group === null && $mood === null) {
            return;
        }

        if ($group === null || $mood === null || ! in_array($mood, self::GROUPS[$group] ?? [], true)) {
            throw ValidationException::withMessages(['mood' => 'Choose a mood from its matching family.']);
        }
    }
}
