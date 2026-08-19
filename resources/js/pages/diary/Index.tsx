import { Head, router } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Search, Settings2, UsersRound } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import { Button } from '../../components/ui';
import { DiaryCalendar } from '../../features/diary/DiaryCalendar';
import { DiaryEditor } from '../../features/diary/DiaryEditor';
import type { DiaryEditorHandle } from '../../features/diary/DiaryEditor';
import { DiaryPanels } from '../../features/diary/DiaryPanels';
import { diaryDayLabel, diaryDayLabelClassName, formatDiaryDate, stateClassName, titleCase } from '../../features/diary/diaryPresentation';
import type { DiaryCalendarData, DiaryDay, DiaryLanguage, DiaryPerson, DiarySaveResult, DiarySaveState, DiarySearchData, MoodCatalog } from '../../features/diary/types';

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
    const editorRef = useRef<DiaryEditorHandle>(null);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<PanelName>(null);
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
    const [day, setDay] = useState(props.selectedDay);
    const [saveState, setSaveState] = useState<DiarySaveState>('idle');
    const [dateNavigationPending, setDateNavigationPending] = useState(false);
    const configuredLanguages = props.languageCatalog.filter((language) => props.settings.languages.includes(language.code));
    const recentDays = props.dateRail.map((railDay) => railDay.date === day.date ? { ...railDay, ...day } : railDay);
    const selectedDayIsRecent = recentDays.some((railDay) => railDay.date === day.date);
    const railDays = selectedDayIsRecent ? recentDays : [day, ...recentDays];
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
            updatedAt: new Date().toISOString(),
        }));
    }, []);

    const handleSaveStateChange = useCallback((state: DiarySaveState) => setSaveState(state), []);

    function openPerson(personId: number) {
        setSelectedPersonId(personId || null);
        setActivePanel('people');
    }

    async function selectDate(date: string) {
        if (date === day.date || dateNavigationPending) return;
        setDateNavigationPending(true);
        const saved = await (editorRef.current?.saveBeforeNavigation() ?? Promise.resolve(true));
        if (saved) router.get('/diary', { date, month: date.slice(0, 7) });
        else setDateNavigationPending(false);
    }

    const previousDate = shiftDate(day.date, -1);
    const nextDate = shiftDate(day.date, 1);

    return (
        <div className="diary-page" style={{ '--module-accent': 'var(--diary-accent)' } as CSSProperties}>
            <Head title="Diary" />

            <header className="mb-5 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.22em] text-[var(--diary-accent)] uppercase">A day, kept</p>
                    <h1 className="mt-1 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Diary</h1>
                </div>
                <div aria-label="Diary tools" className="flex items-center gap-1 rounded-2xl border border-border-subtle bg-surface p-1">
                    <DiaryTool active={activePanel === 'search'} label="Search" onClick={() => setActivePanel('search')}><Search size={18} /></DiaryTool>
                    <DiaryTool active={activePanel === 'people'} label="People" onClick={() => openPerson(0)}><UsersRound size={18} /></DiaryTool>
                    <DiaryTool active={activePanel === 'settings'} label="Settings" onClick={() => setActivePanel('settings')}><Settings2 size={18} /></DiaryTool>
                </div>
            </header>

            <div className="overflow-hidden rounded-[2rem] border border-border-subtle bg-surface shadow-[0_28px_80px_rgba(0,0,0,0.3)] lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
                <aside className="hidden border-r border-border-subtle bg-elevated/45 p-4 lg:flex lg:min-h-[72vh] lg:flex-col">
                    <p className="px-2 text-[0.625rem] font-bold tracking-[0.18em] text-muted uppercase">Recent days</p>
                    <div className="mt-4 space-y-1">
                        {railDays.map((railDay, index) => (
                            <div key={railDay.date}>
                                {!selectedDayIsRecent && index === 1 && <div className="my-3 border-t border-border-subtle" />}
                                <button
                                    aria-current={railDay.date === day.date ? 'date' : undefined}
                                    className={`focus-ring w-full rounded-xl px-2 py-2.5 text-left ${railDay.date === day.date ? 'bg-surface-hover text-foreground' : 'text-secondary hover:bg-surface-hover/60'}`}
                                    disabled={dateNavigationPending}
                                    onClick={() => void selectDate(railDay.date)}
                                    type="button"
                                >
                                    <span className="flex items-center gap-2.5">
                                        <span className={`size-2.5 shrink-0 rounded-full border ${stateClassName(railDay.state)}`} />
                                        <span className="min-w-0 flex-1 truncate font-semibold">{formatDiaryDate(railDay.date)}</span>
                                        {railDay.date === props.today && <span className="text-[0.55rem] font-bold tracking-wider text-muted">TODAY</span>}
                                    </span>
                                    <span className={`mt-0.5 block pl-5 text-[0.625rem] font-bold tracking-wide uppercase ${diaryDayLabelClassName(railDay)}`}>{diaryDayLabel(railDay, props.today)}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button className="mt-auto" fullWidth onClick={() => setCalendarOpen(true)} variant="ghost"><CalendarDays aria-hidden="true" size={17} />Open calendar</Button>
                </aside>

                <main className="min-w-0">
                    <div className="border-b border-border-subtle px-4 py-4 sm:px-8 lg:px-12">
                        <div className="flex items-center justify-between gap-2">
                            <button aria-label="Previous day" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30" disabled={previousDate < props.accountCreatedOn || dateNavigationPending} onClick={() => void selectDate(previousDate)} type="button"><ChevronLeft aria-hidden="true" size={20} /></button>
                            <button className="focus-ring min-w-0 rounded-xl px-2 text-center" onClick={() => setCalendarOpen(true)} type="button">
                                <h2 className="truncate text-xl font-bold tracking-[-0.03em] sm:text-3xl">{formatDiaryDate(day.date, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                                <span className={`mt-1 inline-flex text-xs font-bold tracking-[0.12em] uppercase ${diaryDayLabelClassName(day)}`}>{diaryDayLabel(day, props.today)}{day.locked && day.state !== 'unavailable' && ' · Read only'}</span>
                            </button>
                            <button aria-label="Next day" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-30" disabled={nextDate > props.today || dateNavigationPending} onClick={() => void selectDate(nextDate)} type="button"><ChevronRight aria-hidden="true" size={20} /></button>
                        </div>
                        <div className="mt-3 flex min-h-6 flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold text-muted">
                            <span aria-live="polite" className={saveState === 'error' ? 'text-danger' : ''}>{saveLabel(saveState, day)}</span>
                            {day.locked && <span>{day.mood ? titleCase(day.mood) : 'No mood'} · {day.languageName ?? 'No language'}</span>}
                            {day.state === 'completed' && <span className="text-success">{day.streakAfter} day streak · ×{day.multiplier} · +{day.earnedSp} SP</span>}
                            {day.date !== props.today && <button className="focus-ring rounded-full px-2 py-1 font-bold text-[var(--diary-accent)] hover:bg-surface-hover" disabled={dateNavigationPending} onClick={() => void selectDate(props.today)} type="button">Go to today</button>}
                        </div>
                    </div>

                    <DiaryEditor day={day} key={day.date} languages={configuredLanguages} moodCatalog={props.moodCatalog} onOpenPerson={openPerson} onSaved={handleSaved} onSaveStateChange={handleSaveStateChange} people={props.people} ref={editorRef} />
                </main>
            </div>

            <DiaryCalendar accountCreatedOn={props.accountCreatedOn} calendar={calendar} onClose={() => setCalendarOpen(false)} onSelectDate={(date) => void selectDate(date)} open={calendarOpen} selectedDate={day.date} today={props.today} />
            <DiaryPanels active={activePanel} configuredLanguageCodes={props.settings.languages} languages={props.languageCatalog} moodCatalog={props.moodCatalog} onClose={() => setActivePanel(null)} onOpenPerson={openPerson} onSelectDate={(date) => void selectDate(date)} people={props.people} search={props.search} selectedPersonId={selectedPersonId} />
        </div>
    );
}

function DiaryTool({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
    return <button aria-label={label} aria-pressed={active} className={`focus-ring flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold ${active ? 'bg-elevated text-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`} onClick={onClick} title={label} type="button">{children}<span className="hidden sm:inline">{label}</span></button>;
}

function shiftDate(date: string, offset: number) {
    const shifted = new Date(`${date}T12:00:00`);
    shifted.setDate(shifted.getDate() + offset);

    return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
}

function saveLabel(saveState: DiarySaveState, day: DiaryDay) {
    if (saveState === 'saving') return 'Saving…';
    if (saveState === 'saved') return 'Saved just now';
    if (saveState === 'error') return 'Couldn’t save';
    if (day.updatedAt) return 'All changes saved';

    return day.editable ? 'Autosaves as you write' : '';
}
