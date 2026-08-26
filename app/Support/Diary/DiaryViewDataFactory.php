<?php

namespace App\Support\Diary;

use App\Models\DiaryEntry;
use App\Models\Person;
use App\Models\Season;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class DiaryViewDataFactory
{
    public function __construct(private readonly DiaryLanguageCatalog $languageCatalog) {}

    /** @return array<string, mixed> */
    public function make(User $user, Season $currentSeason, CarbonImmutable $today, CarbonImmutable $selectedDate, CarbonImmutable $calendarMonth, Request $request): array
    {
        $user->loadMissing('seasons');
        $entries = $user->diaryEntries()->with('mentions.person')->get()->keyBy(
            fn (DiaryEntry $entry): string => $entry->entry_date->toDateString(),
        );
        $selectedEntry = $entries->get($selectedDate->toDateString());

        return [
            'today' => $today->toDateString(),
            'accountCreatedOn' => $user->calendar_started_on->toDateString(),
            'selectedDate' => $selectedDate->toDateString(),
            'selectedDay' => $this->day($selectedDate, $today, $user, $currentSeason, $selectedEntry),
            'dateRail' => $this->dateRail($today, $user, $currentSeason, $entries),
            'calendar' => $this->calendar($calendarMonth, $today, $user, $currentSeason, $entries),
            'currentSeason' => [
                'number' => $currentSeason->season_number,
                'startDate' => $currentSeason->start_date->toDateString(),
                'endDate' => $currentSeason->end_date->toDateString(),
                'seasonPoints' => $currentSeason->season_points,
            ],
            'people' => $this->people($user),
            'search' => [
                'query' => (string) $request->query('q', ''),
                'mood' => $request->query('mood'),
                'language' => $request->query('language'),
                'person' => $request->integer('person') ?: null,
                'results' => $this->search($user, $request),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function day(CarbonImmutable $date, CarbonImmutable $today, User $user, Season $currentSeason, ?DiaryEntry $entry): array
    {
        $belongsToSeason = $user->seasons->contains(
            fn (Season $season) => $date->betweenIncluded($season->start_date, $season->end_date),
        );
        $unavailable = $date->isAfter($today)
            || $date->isBefore($user->calendar_started_on)
            || ! $belongsToSeason;
        $seasonIsActive = $today->betweenIncluded($currentSeason->start_date, $currentSeason->end_date);
        $editable = $seasonIsActive && ! $unavailable && $date->betweenIncluded($currentSeason->start_date, $currentSeason->end_date);
        $state = $unavailable ? 'unavailable' : ($entry?->is_completed ? 'completed' : ($date->isSameDay($today) ? 'pending' : 'missed'));
        $language = $entry?->language_code ? $this->languageCatalog->get($entry->language_code) : null;

        return [
            'date' => $date->toDateString(),
            'state' => $state,
            'editable' => $editable,
            'locked' => ! $editable,
            'content' => $entry?->content ?? [['type' => 'text', 'text' => '']],
            'plainText' => $entry?->plain_text ?? '',
            'characterCount' => $entry?->valid_character_count ?? 0,
            'languageCode' => $entry?->language_code,
            'languageName' => $entry?->language_name_snapshot,
            'direction' => $language['direction'] ?? 'ltr',
            'mood' => $entry?->mood,
            'moodGroup' => $entry?->mood_group,
            'streakAfter' => $entry?->streak_after ?? 0,
            'multiplier' => $entry?->reward_multiplier ?? '0.0',
            'earnedSp' => $entry?->earned_sp ?? 0,
            'clientRevision' => $entry?->client_revision ?? 0,
            'updatedAt' => $entry?->updated_at?->toIso8601String(),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function dateRail(CarbonImmutable $today, User $user, Season $currentSeason, $entries): array
    {
        $days = [];

        for ($offset = 0; $offset < 14; $offset++) {
            $date = $today->subDays($offset);
            if ($date->isBefore($user->calendar_started_on)) {
                break;
            }
            $days[] = $this->day($date, $today, $user, $currentSeason, $entries->get($date->toDateString()));
        }

        return $days;
    }

    /** @return array<string, mixed> */
    private function calendar(CarbonImmutable $month, CarbonImmutable $today, User $user, Season $currentSeason, $entries): array
    {
        $gridStart = $month->startOfMonth()->startOfWeek();
        $gridEnd = $month->endOfMonth()->endOfWeek();
        $days = [];

        for ($date = $gridStart; $date->lessThanOrEqualTo($gridEnd); $date = $date->addDay()) {
            $day = $this->day($date, $today, $user, $currentSeason, $entries->get($date->toDateString()));
            $days[] = [...$day, 'inMonth' => $date->month === $month->month];
        }

        return ['month' => $month->format('Y-m'), 'label' => $month->format('F'), 'year' => $month->year, 'days' => $days];
    }

    /** @return list<array<string, mixed>> */
    private function people(User $user): array
    {
        return $user->people()->with(['mentions.entry' => fn ($query) => $query->latest('entry_date')])->orderBy('name')->get()
            ->map(function (Person $person): array {
                $entries = $person->mentions->pluck('entry')->filter()->unique('id')->sortByDesc('entry_date')->values();

                return [
                    'id' => $person->id,
                    'name' => $person->name,
                    'nickname' => $person->nickname,
                    'note' => $person->note,
                    'archived' => $person->archived_at !== null,
                    'mentionCount' => $entries->count(),
                    'recentEntries' => $entries->take(8)->map(fn (DiaryEntry $entry): array => [
                        'date' => $entry->entry_date->toDateString(),
                        'excerpt' => mb_strimwidth($entry->plain_text, 0, 110, '…'),
                    ])->all(),
                ];
            })->all();
    }

    /** @return list<array<string, mixed>> */
    private function search(User $user, Request $request): array
    {
        $queryText = trim((string) $request->query('q', ''));
        $query = $user->diaryEntries()->with('mentions.person');

        $query->when($queryText !== '', fn (Builder $builder) => $builder->where('plain_text', 'like', '%'.$queryText.'%'))
            ->when($request->filled('mood'), fn (Builder $builder) => $builder->where('mood', $request->query('mood')))
            ->when($request->filled('language'), fn (Builder $builder) => $builder->where('language_code', $request->query('language')))
            ->when($request->integer('person') > 0, fn (Builder $builder) => $builder->whereHas(
                'mentions', fn (Builder $mentionQuery) => $mentionQuery->where('person_id', $request->integer('person')),
            ));

        if ($queryText === '' && ! $request->filled('mood') && ! $request->filled('language') && $request->integer('person') === 0) {
            return [];
        }

        return $query->latest('entry_date')->limit(50)->get()->map(fn (DiaryEntry $entry): array => [
            'date' => $entry->entry_date->toDateString(),
            'excerpt' => mb_strimwidth($entry->plain_text, 0, 180, '…'),
            'mood' => $entry->mood,
            'languageCode' => $entry->language_code,
            'languageName' => $entry->language_name_snapshot,
            'completed' => $entry->is_completed,
        ])->all();
    }
}
