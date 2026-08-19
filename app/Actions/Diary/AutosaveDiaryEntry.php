<?php

namespace App\Actions\Diary;

use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Models\DiaryEntry;
use App\Models\DiarySetting;
use App\Models\Season;
use App\Models\User;
use App\Services\Calendar\UserCalendar;
use App\Services\Diary\DiaryContentNormalizer;
use App\Support\Diary\DiaryLanguageCatalog;
use App\Support\Diary\DiaryMoodCatalog;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AutosaveDiaryEntry
{
    public function __construct(
        private readonly SynchronizeUserSeasons $synchronizeSeasons,
        private readonly DiaryContentNormalizer $contentNormalizer,
        private readonly DiaryLanguageCatalog $languageCatalog,
        private readonly DiaryMoodCatalog $moodCatalog,
        private readonly RecalculateDiaryProgression $recalculateProgression,
        private readonly UserCalendar $userCalendar,
    ) {}

    /** @param array<string, mixed> $data */
    public function execute(User $user, CarbonImmutable $date, array $data, ?CarbonImmutable $today = null): DiaryEntry
    {
        $calendarToday = ($today ?? $this->userCalendar->today($user))->startOfDay();
        $currentSeason = $this->synchronizeSeasons->execute($user, $calendarToday);
        $season = $this->editableSeason($user, $date, $calendarToday, $currentSeason);
        $normalized = $this->contentNormalizer->normalize($user, $data['content']);
        $languageCode = $data['language_code'] ?? null;
        $language = $languageCode === null ? null : $this->languageCatalog->get($languageCode);
        $this->moodCatalog->assertPair($data['mood_group'] ?? null, $data['mood'] ?? null);

        $entry = DB::transaction(function () use ($user, $season, $date, $data, $normalized, $languageCode, $language): DiaryEntry {
            $entry = DiaryEntry::query()
                ->where('user_id', $user->id)
                ->whereDate('entry_date', $date)
                ->lockForUpdate()
                ->first();
            $incomingRevision = (int) $data['client_revision'];

            if ($entry !== null && $incomingRevision <= $entry->client_revision) {
                return $entry;
            }

            $this->assertLanguageSelectable($user, $languageCode, $entry);
            $attributes = [
                'season_id' => $season->id,
                'content' => $normalized->nodes,
                'plain_text' => $normalized->plainText,
                'valid_character_count' => $normalized->characterCount,
                'language_code' => $languageCode,
                'language_name_snapshot' => $language['name'] ?? null,
                'mood' => $data['mood'] ?? null,
                'mood_group' => $data['mood_group'] ?? null,
                'is_completed' => $normalized->characterCount >= 20
                    && $languageCode !== null
                    && ($data['mood'] ?? null) !== null
                    && ($data['mood_group'] ?? null) !== null,
                'client_revision' => $incomingRevision,
            ];

            if ($entry === null) {
                $entry = $user->diaryEntries()->create(['entry_date' => $date->toDateString(), ...$attributes]);
            } else {
                $entry->update($attributes);
            }

            $entry->mentions()->delete();
            $entry->mentions()->createMany($normalized->mentions);

            return $entry;
        }, 3);

        $this->recalculateProgression->execute($user, $currentSeason, $calendarToday);

        return $entry->refresh()->load('mentions.person');
    }

    private function editableSeason(User $user, CarbonImmutable $date, CarbonImmutable $today, Season $currentSeason): Season
    {
        if ($date->isAfter($today) || $date->isBefore($user->calendar_started_on)) {
            throw ValidationException::withMessages(['date' => 'This Diary date is unavailable.']);
        }

        if (! $date->betweenIncluded($currentSeason->start_date, $currentSeason->end_date)) {
            throw ValidationException::withMessages(['date' => 'Completed Season Diary history is permanently read-only.']);
        }

        return $currentSeason;
    }

    private function assertLanguageSelectable(User $user, ?string $languageCode, ?DiaryEntry $entry): void
    {
        if ($languageCode === null || $entry?->language_code === $languageCode) {
            return;
        }

        $languages = DiarySetting::query()->where('user_id', $user->id)->value('languages') ?? [];
        $languages = is_string($languages) ? json_decode($languages, true, flags: JSON_THROW_ON_ERROR) : $languages;

        if (! in_array($languageCode, $languages, true)) {
            throw ValidationException::withMessages(['language_code' => 'Add this language in Diary settings before selecting it.']);
        }
    }
}
