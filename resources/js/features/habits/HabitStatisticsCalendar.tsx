import { useState } from 'react';

import { Surface } from '../../components/ui';
import { weekdayLabels } from './habitPresentation';
import { formatStatistic } from './statisticsTypes';
import type { HabitStatisticsData } from './statisticsTypes';

const appearances = {
    completed: 'border-[#267948] bg-[#3fbf73] text-[#07170e]',
    missed: 'border-[#9e363d] bg-[#e25760] text-[#1d080a]',
    skipped: 'border-[#555d69] bg-[#818a97] text-[#0d1014]',
    pending: 'border-[#a87318] bg-[#e8ad3d] text-[#211504]',
};
const symbols = { completed: '✓', missed: '×', skipped: '−', pending: '○' };
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export function HabitStatisticsCalendar({ statistics, unit }: { statistics: HabitStatisticsData; unit: string | null }) {
    const firstYear = Number(statistics.startDate.slice(0, 4));
    const lastYear = Number(statistics.endDate.slice(0, 4));
    const [selectedYear, setSelectedYear] = useState(lastYear);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const year = Math.max(firstYear, Math.min(lastYear, selectedYear));
    const start = statistics.filter === 'all' ? `${year}-01-01` : statistics.startDate;
    const end = statistics.filter === 'all' ? `${year}-12-31` : statistics.endDate;
    const days = new Map(statistics.days.map((day) => [day.date, day]));
    const months: Date[] = [];
    for (const month = new Date(`${start.slice(0, 7)}-01T00:00:00Z`); dateKey(month) <= end; month.setUTCMonth(month.getUTCMonth() + 1)) months.push(new Date(month));
    const selected = selectedDate ? days.get(selectedDate) : null;

    function renderDay(date: string) {
        const inPeriod = date >= statistics.startDate && date <= statistics.endDate;
        const day = inPeriod ? days.get(date) : undefined;
        const description = `${date}: ${day?.state ?? (day ? 'below target' : date > statistics.today ? 'future' : 'no scheduled entry')}${day && !day.required ? ', flexible extra' : ''}${day?.value !== null && day?.value !== undefined ? `, ${formatStatistic(day.value)} ${unit ?? ''}, target ${formatStatistic(day.target)}` : ''}`;
        return <button aria-label={description} aria-pressed={selectedDate === date} className={`focus-ring relative aspect-square rounded-lg border text-sm font-bold ${day?.state ? appearances[day.state] : 'border-transparent text-muted/45'} ${date === statistics.today ? 'ring-1 ring-[var(--module-accent)] ring-offset-1 ring-offset-elevated' : ''}`} disabled={!inPeriod || date > statistics.today} key={date} onClick={() => setSelectedDate(date)} title={description} type="button">
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

    return <Surface className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div><h3 className="text-lg font-bold">Period calendar</h3><p className="mt-1 text-sm text-muted">Select a day to inspect its outcome.</p></div>
            {statistics.filter === 'all' && <label className="text-sm font-semibold">Calendar year <select className="focus-ring ml-2 rounded-lg border border-border-subtle bg-app p-2" onChange={(event) => setSelectedYear(Number(event.target.value))} value={year}>{Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>}
        </div>
        {statistics.filter === 'season' ? <div className="max-w-sm rounded-2xl border border-border-subtle bg-app/45 p-3 sm:p-4">
            <p className="mb-3 text-xs font-semibold text-muted">{start} – {end}</p>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {weekdayLabels.map((label) => <span className="pb-1 text-center text-[0.6rem] font-bold uppercase text-muted" key={label}>{label}</span>)}
                {Array.from({ length: (new Date(`${start}T00:00:00Z`).getUTCDay() + 6) % 7 }, (_, index) => <span key={`blank-${index}`} />)}
                {seasonDates.map(renderDay)}
            </div>
        </div> : <div className={`grid gap-4 ${months.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'max-w-sm'}`}>{months.map(renderMonth)}</div>}
        <p aria-live="polite" className="mt-4 min-h-6 text-sm text-secondary">{selectedDate && selectedDate >= start && selectedDate <= end ? `${selectedDate}: ${selected?.state ?? (selected ? 'Below target' : 'No scheduled entry')}${selected && !selected.required ? ' · Flexible extra' : ''}${selected?.target !== null && selected?.target !== undefined ? ` · Recorded ${formatStatistic(selected.value)} / target ${formatStatistic(selected.target)} ${unit ?? ''}` : ''}` : 'Completed ✓ · Missed × · Skipped − · Pending ○'}</p>
    </Surface>;
}
