<?php

namespace Tests\Concerns;

use App\Actions\Diary\AutosaveDiaryEntry;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\DiaryEntry;
use App\Models\DiarySetting;
use App\Models\User;
use Carbon\CarbonImmutable;

trait CreatesDiaryEntries
{
    protected function diaryUserCreatedOn(string $date): User
    {
        $user = User::factory()->create([
            'created_at' => CarbonImmutable::parse($date),
            'updated_at' => CarbonImmutable::parse($date),
        ]);
        DiarySetting::query()->create(['user_id' => $user->id, 'languages' => ['en', 'ar', 'fr']]);

        return $user;
    }

    /** @param list<array<string, mixed>>|null $content */
    protected function autosaveDiary(
        User $user,
        string $date,
        string $text = 'Today was a very good day.',
        ?array $content = null,
        ?string $language = 'en',
        ?string $mood = 'peaceful',
        ?string $moodGroup = 'calm',
        int $revision = 1,
        ?string $today = null,
    ): DiaryEntry {
        return app(AutosaveDiaryEntry::class)->execute(
            $user,
            CarbonImmutable::parse($date),
            [
                'content' => $content ?? [['type' => 'text', 'text' => $text]],
                'language_code' => $language,
                'mood' => $mood,
                'mood_group' => $moodGroup,
                'client_revision' => $revision,
            ],
            CarbonImmutable::parse($today ?? $date),
        );
    }

    protected function introduceDiarySeason(User $user, string $date): void
    {
        app(SynchronizeUserSeasons::class)->execute($user, CarbonImmutable::parse($date));
        $user->seasons()->update(['introduced_at' => now()]);
    }
}
