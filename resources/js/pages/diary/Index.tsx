import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { CSSProperties } from 'react';

import { Button } from '../../components/ui';
import { DiaryCalendar } from '../../features/diary/DiaryCalendar';
import { DiaryEditor } from '../../features/diary/DiaryEditor';
import { DiaryPanels } from '../../features/diary/DiaryPanels';
import { formatDiaryDate, stateClassName, titleCase } from '../../features/diary/diaryPresentation';
import type { DiaryCalendarData, DiaryDay, DiaryLanguage, DiaryPerson, DiarySaveResult, DiarySearchData, MoodCatalog } from '../../features/diary/types';

interface DiaryPageProps {
    today: string;
    accountCreatedOn: string;
    selectedDate: string;
    selectedDay: DiaryDay;
    dateRail: DiaryDay[];
    calendar: DiaryCalendarData;
    currentSeason: { number: number; startDate: string; endDate: string; seasonPoints: number };
    people: DiaryPerson[];
    search: DiarySearchData;
    settings: { languages: string[] };
    languageCatalog: DiaryLanguage[];
    moodCatalog: MoodCatalog;
}

type PanelName = 'search' | 'people' | 'settings' | null;

export default function DiaryIndex(props: DiaryPageProps) {
    return <DiaryWorkspace key={props.selectedDate} {...props} />;
}

function DiaryWorkspace(props: DiaryPageProps) {
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<PanelName>(null);
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
    const [day, setDay] = useState(props.selectedDay);
    const [seasonPoints, setSeasonPoints] = useState(props.currentSeason.seasonPoints);
    const configuredLanguages = props.languageCatalog.filter((language) => props.settings.languages.includes(language.code));
    const dateRail = props.dateRail.map((railDay) => railDay.date === day.date ? { ...railDay, state: day.state } : railDay);
    const calendar = {
        ...props.calendar,
        days: props.calendar.days.map((calendarDay) => calendarDay.date === day.date ? { ...calendarDay, state: day.state } : calendarDay),
    };

    const handleSaved = useCallback((result: DiarySaveResult) => {
        setDay((current) => ({
            ...current,
            earnedSp: result.earnedSp,
            state: result.state,
            characterCount: result.characterCount,
            languageCode: result.languageCode,
            languageName: result.languageName,
            mood: result.mood,
            moodGroup: result.moodGroup,
            streakAfter: result.streakAfter,
            multiplier: result.multiplier,
        }));
        setSeasonPoints(result.seasonPoints);
    }, []);

    function openPerson(personId: number) {
        setSelectedPersonId(personId || null);
        setActivePanel('people');
    }

    function selectDate(date: string) {
        router.get('/diary', { date, month: date.slice(0, 7) });
    }

    return (
        <div className="diary-page" style={{ '--module-accent': 'var(--diary-accent)' } as CSSProperties}>
            <Head title="Diary" />

            <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.22em] text-[var(--diary-accent)] uppercase">A day, kept</p>
                    <h1 className="mt-1 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Diary</h1>
                </div>
                <nav aria-label="Diary sections" className="flex flex-wrap gap-1 rounded-full border border-border-subtle bg-surface p-1">
                    <button className="focus-ring rounded-full px-4 py-2 text-sm font-bold text-foreground" onClick={() => setActivePanel(null)} type="button">Entries</button>
                    <button className="focus-ring rounded-full px-4 py-2 text-sm font-bold text-secondary hover:bg-surface-hover" onClick={() => setActivePanel('search')} type="button">Search</button>
                    <button className="focus-ring rounded-full px-4 py-2 text-sm font-bold text-secondary hover:bg-surface-hover" onClick={() => openPerson(0)} type="button">People</button>
                    <button className="focus-ring rounded-full px-4 py-2 text-sm font-bold text-secondary hover:bg-surface-hover" onClick={() => setActivePanel('settings')} type="button">Settings</button>
                </nav>
            </header>

            <div className="overflow-hidden rounded-[2rem] border border-border-subtle bg-surface shadow-[0_28px_80px_rgba(0,0,0,0.3)] lg:grid lg:grid-cols-[13rem_minmax(0,1fr)]">
                <aside className="hidden border-r border-border-subtle bg-elevated/55 p-4 lg:flex lg:min-h-[72vh] lg:flex-col">
                    <p className="px-2 text-[0.625rem] font-bold tracking-[0.18em] text-muted uppercase">Date history</p>
                    <div className="mt-4 space-y-1">
                        {dateRail.map((railDay) => (
                            <button
                                aria-current={railDay.date === day.date ? 'date' : undefined}
                                className={`focus-ring flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left ${railDay.date === day.date ? 'bg-surface-hover text-foreground' : 'text-secondary hover:bg-surface-hover/60'}`}
                                key={railDay.date}
                                onClick={() => selectDate(railDay.date)}
                                type="button"
                            >
                                <span className={`size-3 rounded-sm border ${stateClassName(railDay.state)}`} />
                                <span className="font-semibold">{formatDiaryDate(railDay.date)}</span>
                                {railDay.date === props.today && <span className="ml-auto text-[0.55rem] font-bold tracking-wider text-muted">TODAY</span>}
                            </button>
                        ))}
                    </div>
                    <Button className="mt-auto" fullWidth onClick={() => setCalendarOpen(true)} variant="ghost">Expand calendar</Button>
                </aside>

                <main className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-10 lg:px-14">
                        <div>
                            <button className="focus-ring text-left lg:pointer-events-none" onClick={() => setCalendarOpen(true)} type="button">
                                <h2 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">{formatDiaryDate(day.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                                <span className={`mt-1 inline-flex text-xs font-bold tracking-[0.12em] uppercase ${day.state === 'completed' ? 'text-success' : day.state === 'missed' ? 'text-danger' : day.state === 'pending' ? 'text-warning' : 'text-muted'}`}>{day.state}{day.locked && ' · Read only'}</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                            {day.locked && <p className="text-xs text-muted">{day.mood ? titleCase(day.mood) : 'No mood'}<br />{day.languageName ?? 'No language'}</p>}
                            <div><p className="text-[0.6rem] font-bold tracking-widest text-muted uppercase">Entry reward</p><p className="text-lg font-bold text-[var(--diary-accent)]">+{day.earnedSp} SP</p></div>
                            <div><p className="text-[0.6rem] font-bold tracking-widest text-muted uppercase">Streak</p><p className="text-lg font-bold">{day.streakAfter || '—'}</p></div>
                            <div><p className="text-[0.6rem] font-bold tracking-widest text-muted uppercase">Multiplier</p><p className="text-lg font-bold">{day.streakAfter > 0 ? `×${day.multiplier}` : '—'}</p></div>
                            <div><p className="text-[0.6rem] font-bold tracking-widest text-muted uppercase">Season {props.currentSeason.number}</p><p className="text-lg font-bold">{seasonPoints} SP</p></div>
                        </div>
                    </div>

                    <DiaryEditor day={day} key={day.date} languages={configuredLanguages} moodCatalog={props.moodCatalog} onOpenPerson={openPerson} onSaved={handleSaved} people={props.people} />
                    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-3 text-xs text-muted sm:px-10 lg:px-14">
                        <span>{day.characterCount}/20 visible characters {day.characterCount >= 20 && (!day.languageCode || !day.mood) ? `· ${day.languageCode ? 'choose a mood to complete this day' : day.mood ? 'choose a language to complete this day' : 'choose a mood and language to complete this day'}` : ''}</span>
                        <span>{day.streakAfter > 0 ? `${day.streakAfter} day writing streak · ×${day.multiplier}` : 'A completed day begins the streak'}</span>
                    </footer>
                </main>
            </div>

            <button className="focus-ring fixed right-4 bottom-24 z-20 rounded-full border border-border-strong bg-elevated px-4 py-3 text-sm font-bold shadow-xl lg:hidden" onClick={() => setCalendarOpen(true)} type="button">Calendar</button>

            <DiaryCalendar calendar={calendar} onClose={() => setCalendarOpen(false)} open={calendarOpen} selectedDate={day.date} />
            <DiaryPanels active={activePanel} configuredLanguageCodes={props.settings.languages} languages={props.languageCatalog} moodCatalog={props.moodCatalog} onClose={() => setActivePanel(null)} onOpenPerson={openPerson} people={props.people} search={props.search} selectedPersonId={selectedPersonId} />
        </div>
    );
}
