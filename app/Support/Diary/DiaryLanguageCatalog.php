<?php

namespace App\Support\Diary;

use Illuminate\Validation\ValidationException;

class DiaryLanguageCatalog
{
    /** @var array<string, array{name: string, direction: string}> */
    private const LANGUAGES = [
        'ar' => ['name' => 'Arabic', 'direction' => 'rtl'],
        'de' => ['name' => 'German', 'direction' => 'ltr'],
        'en' => ['name' => 'English', 'direction' => 'ltr'],
        'es' => ['name' => 'Spanish', 'direction' => 'ltr'],
        'fa' => ['name' => 'Persian', 'direction' => 'rtl'],
        'fr' => ['name' => 'French', 'direction' => 'ltr'],
        'he' => ['name' => 'Hebrew', 'direction' => 'rtl'],
        'hi' => ['name' => 'Hindi', 'direction' => 'ltr'],
        'it' => ['name' => 'Italian', 'direction' => 'ltr'],
        'ja' => ['name' => 'Japanese', 'direction' => 'ltr'],
        'ko' => ['name' => 'Korean', 'direction' => 'ltr'],
        'nl' => ['name' => 'Dutch', 'direction' => 'ltr'],
        'pt' => ['name' => 'Portuguese', 'direction' => 'ltr'],
        'ru' => ['name' => 'Russian', 'direction' => 'ltr'],
        'tr' => ['name' => 'Turkish', 'direction' => 'ltr'],
        'ur' => ['name' => 'Urdu', 'direction' => 'rtl'],
        'zh' => ['name' => 'Chinese', 'direction' => 'ltr'],
    ];

    /** @return array<int, array{code: string, name: string, direction: string}> */
    public function all(): array
    {
        return collect(self::LANGUAGES)
            ->map(fn (array $language, string $code): array => ['code' => $code, ...$language])
            ->values()
            ->all();
    }

    /** @return array{name: string, direction: string} */
    public function get(string $code): array
    {
        $language = self::LANGUAGES[$code] ?? null;

        if ($language === null) {
            throw ValidationException::withMessages(['language_code' => 'Choose a supported Diary language.']);
        }

        return $language;
    }
}
