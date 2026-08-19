<?php

namespace App\Http\Controllers;

use App\Actions\Diary\AutosaveDiaryEntry;
use App\Actions\Seasons\SynchronizeUserSeasons;
use App\Http\Requests\AutosaveDiaryEntryRequest;
use App\Models\DiarySetting;
use App\Services\Calendar\UserCalendar;
use App\Support\Diary\DiaryLanguageCatalog;
use App\Support\Diary\DiaryMoodCatalog;
use App\Support\Diary\DiaryViewDataFactory;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DiaryController extends Controller
{
    public function index(
        Request $request,
        SynchronizeUserSeasons $synchronizeSeasons,
        DiaryViewDataFactory $viewDataFactory,
        DiaryLanguageCatalog $languageCatalog,
        DiaryMoodCatalog $moodCatalog,
        UserCalendar $calendar,
    ): Response {
        $user = $request->user();
        $today = $calendar->today($user);
        $currentSeason = $synchronizeSeasons->execute($user, $today);
        $selectedDate = $this->dateFromQuery($request->query('date'), $today, 'date');
        $calendarMonth = $this->dateFromQuery($request->query('month'), $selectedDate, 'month')->startOfMonth();
        $settings = DiarySetting::query()->firstOrCreate(['user_id' => $user->id], ['languages' => ['en', 'ar', 'fr']]);

        return Inertia::render('diary/Index', [
            ...$viewDataFactory->make($user, $currentSeason, $today, $selectedDate, $calendarMonth, $request),
            'settings' => ['languages' => $settings->languages],
            'languageCatalog' => $languageCatalog->all(),
            'moodCatalog' => $moodCatalog->all(),
        ]);
    }

    public function update(
        AutosaveDiaryEntryRequest $request,
        string $date,
        AutosaveDiaryEntry $autosave,
        UserCalendar $calendar,
    ): JsonResponse {
        $today = $calendar->today($request->user());
        $entryDate = $this->requiredDate($date, $today);
        $entry = $autosave->execute($request->user(), $entryDate, $request->validated(), $today);

        return response()->json([
            'entry' => [
                'date' => $entry->entry_date->toDateString(),
                'state' => $entry->is_completed ? 'completed' : ($entryDate->isSameDay($today) ? 'pending' : 'missed'),
                'characterCount' => $entry->valid_character_count,
                'languageCode' => $entry->language_code,
                'languageName' => $entry->language_name_snapshot,
                'mood' => $entry->mood,
                'moodGroup' => $entry->mood_group,
                'streakAfter' => $entry->streak_after,
                'multiplier' => $entry->reward_multiplier,
                'earnedSp' => $entry->earned_sp,
                'clientRevision' => $entry->client_revision,
                'updatedAt' => $entry->updated_at->toIso8601String(),
            ],
            'seasonPoints' => $entry->season->season_points,
        ]);
    }

    private function dateFromQuery(mixed $value, CarbonImmutable $fallback, string $precision): CarbonImmutable
    {
        if (! is_string($value) || $value === '') {
            return $fallback;
        }

        $format = $precision === 'month' ? '!Y-m' : '!Y-m-d';
        $date = CarbonImmutable::createFromFormat($format, $value);

        if ($date === false || $date->format($precision === 'month' ? 'Y-m' : 'Y-m-d') !== $value) {
            throw ValidationException::withMessages([$precision => 'Choose a valid calendar '.$precision.'.']);
        }

        return $date;
    }

    private function requiredDate(string $value, CarbonImmutable $today): CarbonImmutable
    {
        return $this->dateFromQuery($value, $today, 'date');
    }
}
