import { Activity } from 'lucide-react';
import { useId, useState } from 'react';

import { Surface } from '../../components/ui';
import { formatStatistic } from './statisticsTypes';
import type { HabitStatisticsData } from './statisticsTypes';

const chartWidth = 800;
const chartHeight = 280;
const padding = { top: 24, right: 18, bottom: 38, left: 42 };

export function HabitStatisticsCharts({ statistics, numeric, unit }: { statistics: HabitStatisticsData; numeric: boolean; unit: string | null }) {
    const [metric, setMetric] = useState<'total' | 'average'>('total');
    const [focusedDate, setFocusedDate] = useState<string | null>(null);
    const [selectedPointDate, setSelectedPointDate] = useState<string | null>(null);
    const gradientId = useId().replace(/:/g, '');
    const buckets = statistics.trend.buckets;
    const values = buckets.map((bucket) => numeric ? bucket[metric] : bucket.completed);
    const maximum = Math.ceil(Math.max(1, ...values.map((value) => value ?? 0), ...(numeric ? buckets.map((bucket) => bucket.target ?? 0) : [])) / (numeric ? 1 : 2)) * (numeric ? 1 : 2);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const x = (index: number) => padding.left + (buckets.length === 1 ? plotWidth / 2 : index / Math.max(1, buckets.length - 1) * plotWidth);
    const y = (value: number) => padding.top + plotHeight - value / maximum * plotHeight;
    const focused = buckets.find((bucket) => bucket.date === (focusedDate ?? selectedPointDate));
    const outcomeTotal = statistics.current.requiredCompleted + statistics.current.missed + statistics.current.skipped;
    const outcomes = [
        { label: 'Completed', value: statistics.current.requiredCompleted, color: 'var(--habit-completed)' },
        { label: 'Missed', value: statistics.current.missed, color: 'var(--habit-missed)' },
        { label: 'Skipped', value: statistics.current.skipped, color: 'var(--habit-skipped)' },
    ];
    let offset = 0;
    const segments = outcomes.map((outcome) => {
        const start = offset;
        offset += outcomeTotal ? outcome.value / outcomeTotal * 100 : 0;
        return `${outcome.color} ${start}% ${offset}%`;
    });
    const path = values.map((value, index) => value === null ? '' : `${index === 0 || values[index - 1] === null ? 'M' : 'L'} ${x(index)} ${y(value)}`).join(' ');
    const firstPoint = values.findIndex((value) => value !== null);
    const lastPoint = values.reduce<number>((lastIndex, value, index) => value === null ? lastIndex : index, -1);
    const areaPath = firstPoint === -1 || lastPoint === -1 ? '' : `${path} L ${x(lastPoint)} ${padding.top + plotHeight} L ${x(firstPoint)} ${padding.top + plotHeight} Z`;
    const labelStep = Math.max(1, Math.ceil(buckets.length / 6));

    return <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
        <Surface className="min-w-0 rounded-3xl p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="flex items-center gap-2 text-lg font-bold"><Activity aria-hidden="true" className="text-accent-ink" size={18} />{numeric ? 'Recorded values' : 'Completion trend'}</h3><p className="mt-1 text-sm text-muted">{numeric ? `${metric === 'total' ? 'Total' : 'Average per recorded day'} ${unit ?? ''}` : 'Times completed'} per {statistics.trend.unit}</p></div>
                {numeric && <div aria-label="Chart metric" className="flex gap-1 rounded-full border border-border-subtle p-1" role="group">{(['total', 'average'] as const).map((value) => <button aria-pressed={metric === value} className={`focus-ring min-h-10 rounded-full px-4 py-1.5 text-xs font-bold ${metric === value ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted'}`} key={value} onClick={() => setMetric(value)} type="button">{value === 'total' ? 'Total' : 'Average'}</button>)}</div>}
            </div>
            {statistics.days.length === 0 ? <p className="mt-5 grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/40 px-5 text-center text-sm text-muted">No habit entries in this period.</p> : <>
                <div aria-label="Scrollable activity chart" className="focus-ring mt-5 overflow-x-auto rounded-xl" role="region" tabIndex={0}>
                <svg aria-label={`${numeric ? metric : 'Completions'} per ${statistics.trend.unit}`} className="h-auto min-w-[620px] w-full" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--module-accent)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--module-accent)" stopOpacity="0" /></linearGradient></defs>
                    {[1, 0.75, 0.5, 0.25, 0].map((fraction) => <g key={fraction}><line stroke="var(--border-subtle)" strokeDasharray={fraction === 0 ? undefined : '4 8'} x1={padding.left} x2={chartWidth - padding.right} y1={y(maximum * fraction)} y2={y(maximum * fraction)} /><text fill="var(--text-muted)" fontSize="11" textAnchor="end" x={padding.left - 10} y={y(maximum * fraction) + 4}>{formatStatistic(maximum * fraction)}</text></g>)}
                    {numeric && buckets.map((bucket, index) => bucket.target !== null && <line key={`target-${bucket.date}`} stroke="var(--text-muted)" strokeDasharray="4 3" x1={Math.max(padding.left, x(index) - plotWidth / Math.max(1, buckets.length - 1) / 2)} x2={Math.min(chartWidth - padding.right, x(index) + plotWidth / Math.max(1, buckets.length - 1) / 2)} y1={y(bucket.target)} y2={y(bucket.target)} />)}
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path d={path} fill="none" stroke="var(--module-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                    {buckets.map((bucket, index) => {
                        const value = values[index] ?? null;
                        const label = `${bucket.label}: ${formatStatistic(value)} ${numeric ? unit ?? '' : 'completions'}${numeric && bucket.target !== null ? `, target ${formatStatistic(bucket.target)}` : ''}`;
                        const active = focused?.date === bucket.date;
                        const tooltipX = Math.min(chartWidth - 66, Math.max(66, x(index)));
                        const tooltipY = Math.max(2, y(value ?? 0) - 56);
                        return value !== null && <g aria-label={label} key={bucket.date} onBlur={() => setFocusedDate(null)} onClick={() => setSelectedPointDate(bucket.date)} onFocus={() => setFocusedDate(bucket.date)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedPointDate(bucket.date); } }} onMouseEnter={() => setFocusedDate(bucket.date)} onMouseLeave={() => setFocusedDate(null)} role="button" tabIndex={0}><circle className="cursor-pointer" cx={x(index)} cy={y(value)} fill="transparent" r="14" /><circle cx={x(index)} cy={y(value)} fill={active ? 'var(--module-accent)' : 'var(--surface-primary)'} r={active ? 6 : 4} stroke="var(--module-accent)" strokeWidth="3" />{active && <g aria-hidden="true"><rect fill="var(--surface-elevated)" height="44" rx="10" stroke="var(--border-strong)" width="116" x={tooltipX - 58} y={tooltipY} /><text fill="var(--text-secondary)" fontSize="10" textAnchor="middle" x={tooltipX} y={tooltipY + 15}>{bucket.label}</text><text fill="var(--text-primary)" fontSize="14" fontWeight="700" textAnchor="middle" x={tooltipX} y={tooltipY + 33}>{formatStatistic(value)} {numeric ? unit ?? '' : 'completed'}</text></g>}</g>;
                    })}
                    {buckets.map((bucket, index) => index === 0 || index === buckets.length - 1 || index % labelStep === 0 ? <text fill="var(--text-muted)" fontSize="10" key={bucket.date} textAnchor={index === 0 ? 'start' : index === buckets.length - 1 ? 'end' : 'middle'} x={x(index)} y={chartHeight - 10}>{bucket.label}</text> : null)}
                </svg>
                </div>
                <p className="mt-2 text-[0.65rem] text-muted sm:hidden">Swipe the chart to explore. Tap a point for details.</p>
                <p aria-live="polite" className="mt-3 min-h-10 rounded-xl border border-border-subtle bg-app/40 px-3 py-2.5 text-xs text-secondary">{focused ? `${focused.label}: ${formatStatistic(numeric ? focused[metric] : focused.completed)} ${numeric ? unit ?? '' : 'completions'}${numeric && focused.target !== null ? ` · Target ${formatStatistic(focused.target)}` : ''}` : numeric && statistics.trend.unit === 'day' ? 'Dashed marks show historical daily targets. Missing averages remain gaps.' : 'Inspect points for exact values.'}</p>
            </>}
        </Surface>
        <Surface className="rounded-3xl p-4 sm:p-6">
            <h3 className="text-lg font-bold">Scheduled outcomes</h3><p className="mt-1 text-xs text-muted">How your resolved days add up</p>
            <div aria-label={`${outcomeTotal} resolved scheduled days`} className="mx-auto my-6 grid size-44 place-items-center rounded-full" role="img" style={{ background: outcomeTotal ? `conic-gradient(${segments.join(',')})` : 'var(--border-subtle)' }}><div className="grid size-32 content-center rounded-full bg-surface text-center"><strong className="text-3xl">{outcomeTotal}</strong><span className="text-xs text-muted">resolved days</span></div></div>
            <ul className="space-y-1">{outcomes.map((outcome) => <li className="flex items-center justify-between gap-2 rounded-xl bg-app/50 px-3 py-2.5 text-xs" key={outcome.label}><span className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: outcome.color }} />{outcome.label}</span><span className="font-semibold tabular-nums">{outcome.value} · {outcomeTotal ? formatStatistic(Math.round(outcome.value / outcomeTotal * 1000) / 10) : '0'}%</span></li>)}</ul>
            <p className="mt-4 text-xs leading-5 text-muted">Includes skipped days; completion rate excludes them.{statistics.current.extras > 0 ? ` ${statistics.current.extras} flexible extras are counted separately.` : ''}</p>
        </Surface>
    </div>;
}
