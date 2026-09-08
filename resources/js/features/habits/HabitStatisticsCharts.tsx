import { useState } from 'react';

import { Surface } from '../../components/ui';
import { formatStatistic } from './statisticsTypes';
import type { HabitStatisticsData } from './statisticsTypes';

export function HabitStatisticsCharts({ statistics, numeric, unit }: { statistics: HabitStatisticsData; numeric: boolean; unit: string | null }) {
    const [metric, setMetric] = useState<'total' | 'average'>('total');
    const [focusedDate, setFocusedDate] = useState<string | null>(null);
    const buckets = statistics.trend.buckets;
    const values = buckets.map((bucket) => numeric ? bucket[metric] : bucket.completed);
    const maximum = Math.max(1, ...values.map((value) => value ?? 0), ...(numeric ? buckets.map((bucket) => bucket.target ?? 0) : []));
    const x = (index: number) => 48 + index / Math.max(1, buckets.length - 1) * 684;
    const y = (value: number) => 208 - value / maximum * 176;
    const focused = buckets.find((bucket) => bucket.date === focusedDate);
    const outcomeTotal = statistics.current.requiredCompleted + statistics.current.missed + statistics.current.skipped;
    const outcomes = [
        { label: 'Completed', value: statistics.current.requiredCompleted, color: '#3fbf73' },
        { label: 'Missed', value: statistics.current.missed, color: '#e25760' },
        { label: 'Skipped', value: statistics.current.skipped, color: '#818a97' },
    ];
    let offset = 0;
    const segments = outcomes.map((outcome) => {
        const start = offset;
        offset += outcomeTotal ? outcome.value / outcomeTotal * 100 : 0;
        return `${outcome.color} ${start}% ${offset}%`;
    });
    const path = values.map((value, index) => value === null ? '' : `${index === 0 || values[index - 1] === null ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ');

    return <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <Surface className="min-w-0 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="text-lg font-bold">{numeric ? 'Recorded values' : 'Completion trend'}</h3><p className="mt-1 text-sm text-muted">{numeric ? `${metric === 'total' ? 'Total' : 'Average per recorded day'} ${unit ?? ''}` : 'Times completed'} per {statistics.trend.unit}</p></div>
                {numeric && <div aria-label="Chart metric" className="flex gap-1 rounded-full border border-border-subtle p-1" role="group">{(['total', 'average'] as const).map((value) => <button aria-pressed={metric === value} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold ${metric === value ? 'bg-[var(--module-accent)] text-black' : 'text-muted'}`} key={value} onClick={() => setMetric(value)} type="button">{value === 'total' ? 'Total' : 'Average'}</button>)}</div>}
            </div>
            {statistics.days.length === 0 ? <p className="grid min-h-64 place-items-center text-sm text-muted">No habit entries in this period.</p> : <>
                <svg aria-label={`${numeric ? metric : 'Completions'} per ${statistics.trend.unit}`} className="mt-4 w-full overflow-visible" role="img" viewBox="0 0 760 250">
                    {[0, 0.5, 1].map((fraction) => <g key={fraction}><line stroke="var(--border-subtle)" x1="48" x2="732" y1={y(maximum * fraction)} y2={y(maximum * fraction)} /><text fill="var(--text-muted)" fontSize="11" textAnchor="end" x="40" y={y(maximum * fraction) + 4}>{formatStatistic(maximum * fraction)}</text></g>)}
                    {numeric && buckets.map((bucket, index) => bucket.target !== null && <line key={`target-${bucket.date}`} stroke="var(--text-muted)" strokeDasharray="4 3" x1={Math.max(48, x(index) - 342 / Math.max(1, buckets.length - 1))} x2={Math.min(732, x(index) + 342 / Math.max(1, buckets.length - 1))} y1={y(bucket.target)} y2={y(bucket.target)} />)}
                    <path d={path} fill="none" stroke="var(--module-accent)" strokeLinejoin="round" strokeWidth="3" />
                    {buckets.map((bucket, index) => {
                        const value = values[index] ?? null;
                        const label = `${bucket.label}: ${formatStatistic(value)} ${numeric ? unit ?? '' : 'completions'}${numeric && bucket.target !== null ? `, target ${formatStatistic(bucket.target)}` : ''}`;
                        return value !== null && <circle aria-label={label} className="focus-ring" cx={x(index)} cy={y(value)} fill="var(--module-accent)" key={bucket.date} onBlur={() => setFocusedDate(null)} onFocus={() => setFocusedDate(bucket.date)} onMouseEnter={() => setFocusedDate(bucket.date)} onMouseLeave={() => setFocusedDate(null)} r={focusedDate === bucket.date ? 6 : 3} role="img" tabIndex={0}><title>{label}</title></circle>;
                    })}
                    {[0, Math.floor((buckets.length - 1) / 2), buckets.length - 1].filter((value, index, list) => value >= 0 && list.indexOf(value) === index).map((index) => <text fill="var(--text-muted)" fontSize="11" key={index} textAnchor={index === 0 ? 'start' : index === buckets.length - 1 ? 'end' : 'middle'} x={x(index)} y="238">{buckets[index]?.label}</text>)}
                </svg>
                <p aria-live="polite" className="min-h-6 text-xs text-muted">{focused ? `${focused.label}: ${formatStatistic(numeric ? focused[metric] : focused.completed)} ${numeric ? unit ?? '' : 'completions'}${numeric && focused.target !== null ? ` · Target ${formatStatistic(focused.target)}` : ''}` : numeric && statistics.trend.unit === 'day' ? 'Dashed marks show historical daily targets. Missing averages remain gaps.' : 'Inspect points for exact values.'}</p>
            </>}
        </Surface>
        <Surface className="p-4 sm:p-6">
            <h3 className="text-lg font-bold">Scheduled outcomes</h3>
            <div aria-label={`${outcomeTotal} resolved scheduled days`} className="mx-auto my-5 grid size-40 place-items-center rounded-full" role="img" style={{ background: outcomeTotal ? `conic-gradient(${segments.join(',')})` : 'var(--border-subtle)' }}><div className="grid size-28 content-center rounded-full bg-surface text-center"><strong className="text-3xl">{outcomeTotal}</strong><span className="text-xs text-muted">resolved days</span></div></div>
            <ul className="space-y-2">{outcomes.map((outcome) => <li className="flex items-center justify-between gap-2 text-sm" key={outcome.label}><span className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: outcome.color }} />{outcome.label}</span><span>{outcome.value} · {outcomeTotal ? formatStatistic(Math.round(outcome.value / outcomeTotal * 1000) / 10) : '0'}%</span></li>)}</ul>
            <p className="mt-4 text-xs leading-5 text-muted">{statistics.current.extras} flexible extra completions. Pending days are excluded.</p>
        </Surface>
    </div>;
}
