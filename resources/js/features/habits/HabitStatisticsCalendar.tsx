import { CalendarDays, MousePointer2 } from 'lucide-react';
import { useState } from 'react';

import { Surface } from '../../components/ui';
import { weekdayLabels } from './habitPresentation';
import { formatStatistic } from './statisticsTypes';
import type { HabitStatisticsData } from './statisticsTypes';

const appearances = {
    completed: 'border-[var(--habit-completed-border)] bg-[var(--habit-completed)] text-[var(--habit-completed-foreground)]',
    missed: 'border-[var(--habit-missed-border)] bg-[var(--habit-missed)] text-[var(--habit-missed-foreground)]',
    skipped: 'border-[var(--habit-skipped-border)] bg-[var(--habit-skipped)] text-[var(--habit-skipped-foreground)]',
    pending: 'border-[var(--habit-pending-border)] bg-[var(--habit-pending)] text-[var(--habit-pending-foreground)]',
};
const symbols = { completed: '✓', missed: '×', skipped: '−', pending: '○' };
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export function HabitStatisticsCalendar({ statistics, unit }: { statistics: HabitStatisticsData; unit: string | null }) {
    const firstYear = Number(statistics.startDate.slice(0, 4));
    const lastYear = Number(statistics.endDate.slice(0, 4));
    const [selectedYear, setSelectedYear] = useState(lastYear);
    const [selectedDate, setSelectedDate] = useState<string | null>(() => statistics.days.at(-1)?.date ?? null);
    const year = Math.max(firstYear, Math.min(lastYear, selectedYear));
    const start = statistics.filter === 'all' ? `${year}-01-01` : statistics.startDate;
    const end = statistics.filter === 'all' ? `${year}-12-31` : statistics.endDate;
    const days = new Map(statistics.days.map((day) => [day.date, day]));
    const months: Date[] = [];
    for (const month = new Date(`${start.slice(0, 7)}-01T00:00:00Z`); dateKey(month) <= end; month.setUTCMonth(month.getUTCMonth() + 1)) months.push(new Date(month));
    const visibleSelection = selectedDate && selectedDate >= start && selectedDate <= end ? selectedDate : null;
    const selected = visibleSelection ? days.get(visibleSelection) : null;
    const compact = statistics.filter === 'season' || statistics.filter === 'month';

    function renderDay(date: string) {
        const inPeriod = date >= statistics.startDate && date <= statistics.endDate;
        const day = inPeriod ? days.get(date) : undefined;
        const description = `${date}: ${day?.state ?? (day ? 'below target' : date > statistics.today ? 'future' : 'no scheduled entry')}${day && !day.required ? ', flexible extra' : ''}${day?.value !== null && day?.value !== undefined ? `, ${formatStatistic(day.value)} ${unit ?? ''}, target ${formatStatistic(day.target)}` : ''}`;
        return <button aria-label={description} aria-pressed={visibleSelection === date} className={`focus-ring relative aspect-square rounded-lg border text-sm font-bold transition-[box-shadow,transform] enabled:hover:-translate-y-0.5 enabled:hover:shadow-md ${day?.state ? appearances[day.state] : 'border-transparent text-muted/45'} ${visibleSelection === date ? 'ring-2 ring-foreground ring-offset-2 ring-offset-elevated z-10' : date === statistics.today ? 'ring-1 ring-[var(--module-accent)] ring-offset-1 ring-offset-elevated' : ''}`} disabled={!inPeriod || date > statistics.today} key={date} onClick={() => setSelectedDate(date)} title={description} type="button">
            {Number(date.slice(8))}{statistics.filter === 'season' && (date === start || date.endsWith('-01')) && <span aria-hidden="true" className="absolute left-1 top-0.5 text-[0.5rem] uppercase">{new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })}</span>}{day?.state && <span aria-hidden="true" className="absolute bottom-0 right-1 text-[0.6rem]">{symbols[day.state]}</span>}
        </button>;
    }

    function renderMonth(month: Date) {
        const leading = (month.getUTCDay() + 6) % 7;
        const count = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
        return <div className="min-w-0 rounded-2xl border border-border-subtle bg-app/45 p-3" key={dateKey(month)}>
            <h4 className="mb-3 text-sm font-bold">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h4>
            <div className="grid grid-cols-7 gap-1.5">
                {weekdayLabels.map((label) => <span className="pb-1 text-center text-[0.6rem] font-bold uppercase text-muted" key={label}>{label}</span>)}
                {Array.from({ length: leading }, (_, index) => <span key={`blank-${index}`} />)}
                {Array.from({ length: count }, (_, index) => renderDay(dateKey(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1)))))}
            </div>
        </div>;
    }

    const seasonDates: string[] = [];
    if (statistics.filter === 'season') {
        for (const date = new Date(`${start}T00:00:00Z`); dateKey(date) <= end; date.setUTCDate(date.getUTCDate() + 1)) seasonDates.push(dateKey(date));
    }

    return <Surface className="rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="flex items-center gap-2 text-lg font-bold"><CalendarDays aria-hidden="true" className="text-accent-ink" size={18} />Period calendar</h3><p className="mt-1 text-sm text-muted">Select a day to inspect its outcome.</p></div>
            {statistics.filter === 'all' && <label className="text-sm font-semibold">Calendar year <select className="focus-ring ml-2 rounded-lg border border-border-subtle bg-app p-2" onChange={(event) => setSelectedYear(Number(event.target.value))} value={year}>{Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
        </div>
        <div className="mb-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-secondary" aria-label="Calendar legend">
            {Object.entries(symbols).map(([state, symbol]) => <span className="inline-flex items-center gap-1.5 capitalize" key={state}><span aria-hidden="true" className={`grid size-5 place-items-center rounded ${appearances[state as keyof typeof appearances]}`}>{symbol}</span>{state}</span>)}
        </div>
        <div className={compact ? 'grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : 'space-y-5'}>
        {statistics.filter === 'season' ? <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-app/45 p-3 sm:p-4">
            <p className="mb-3 text-xs font-semibold text-muted">{start} – {end}</p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekdayLabels.map((label) => <span className="pb-1 text-center text-[0.6rem] font-bold uppercase text-muted" key={label}>{label}</span>)}
                {Array.from({ length: (new Date(`${start}T00:00:00Z`).getUTCDay() + 6) % 7 }, (_, index) => <span key={`blank-${index}`} />)}
                {seasonDates.map(renderDay)}
            </div>
        </div> : <div className={`grid gap-4 ${months.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'w-full max-w-md'}`}>{months.map(renderMonth)}</div>}
            <aside aria-live="polite" className="rounded-2xl border border-border-subtle bg-app/45 p-5 sm:p-6">
                <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted">Day details</p>
                {visibleSelection ? <>
                    <h4 className="text-xl font-bold tracking-tight">{new Date(`${visibleSelection}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</h4>
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold capitalize">
                        {selected?.state && <span aria-hidden="true" className={`grid size-6 place-items-center rounded-md ${appearances[selected.state]}`}>{symbols[selected.state]}</span>}
                        {selected?.state ?? (selected ? 'Below target' : 'No scheduled entry')}
                        {visibleSelection === statistics.today && <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[0.65rem] text-muted">Today</span>}
                    </p>
                    {selected?.target != null && <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
                        <div><p className="text-xs text-muted">Recorded</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatStatistic(selected.value)}<span className="ml-1 text-xs font-normal text-muted">{unit}</span></p></div>
                        <div><p className="text-xs text-muted">Target that day</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatStatistic(selected.target)}<span className="ml-1 text-xs font-normal text-muted">{unit}</span></p></div>
                    </div>}
                    <p className="mt-5 text-xs leading-5 text-muted">{selected ? selected.required ? 'Scheduled habit day.' : 'Flexible extra. Does not affect your scheduled completion rate.' : 'No habit outcome was recorded on this date.'} Select another day to explore your history.</p>
                </> : <div className="py-5"><MousePointer2 aria-hidden="true" className="mb-3 text-muted" size={24} /><h4 className="font-bold">A closer look at each day</h4><p className="mt-2 text-sm leading-6 text-muted">Select a date to see its outcome{unit ? ', recorded value, and historical target' : ''}.</p></div>}
            </aside>
        </div>
    </Surface>;
}
