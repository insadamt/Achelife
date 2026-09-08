import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Surface } from '../../components/ui';
import { HabitStatisticsCalendar } from '../../features/habits/HabitStatisticsCalendar';
import { HabitStatisticsCharts } from '../../features/habits/HabitStatisticsCharts';
import { formatStatistic } from '../../features/habits/statisticsTypes';
import type { HabitStatisticsData, HabitStatisticsTotals } from '../../features/habits/statisticsTypes';

interface HabitIdentity { id: number; name: string; type: 'boolean' | 'numeric'; unit: string | null; archived: boolean }

function Delta({ current, previous, percentage }: { current: number | null; previous: number | null; percentage: boolean }) {
    if (current === null || previous === null) return <span className="text-muted">No previous result</span>;
    const difference = Math.round((current - previous) * 1000) / 1000;
    const signed = `${difference > 0 ? '+' : ''}${formatStatistic(difference)}`;
    const relative = previous === 0 ? difference === 0 ? 'No change' : 'Previously 0' : `${difference > 0 ? '+' : ''}${formatStatistic(Math.round(difference / previous * 1000) / 10)}%`;
    return <span className={difference > 0 ? 'text-success' : difference < 0 ? 'text-danger' : 'text-muted'}>{percentage ? `${signed} pp` : `${signed} · ${relative}`}</span>;
}

export default function HabitStatisticsPage({ habit, statistics }: { habit: HabitIdentity; statistics: HabitStatisticsData }) {
    const [loading, setLoading] = useState(false);
    const numeric = habit.type === 'numeric';
    const metrics: { key: keyof HabitStatisticsTotals; label: string; detail: string }[] = [
        { key: 'completionRate', label: 'Completion rate', detail: 'Completed ÷ completed and missed required days' },
        { key: 'completed', label: 'Times completed', detail: `${statistics.current.extras} flexible extras included` },
        { key: 'bestStreak', label: 'Best streak', detail: 'Completions within this period' },
        ...(numeric ? [
            { key: 'total' as const, label: 'Total recorded', detail: habit.unit ?? 'Recorded values' },
            { key: 'average' as const, label: 'Average', detail: `Per recorded day · ${statistics.current.recordedDays} days · ${habit.unit ?? ''}` },
        ] : []),
    ];

    function visitPeriod(filter: HabitStatisticsData['filter'], value?: string | null) {
        const url = new URL(window.location.href);
        url.searchParams.set('statistics_period', filter);
        if (value) url.searchParams.set('statistics_value', value);
        else url.searchParams.delete('statistics_value');
        router.get(`${url.pathname}${url.search}`, {}, { only: ['statistics'], preserveScroll: true, preserveState: true, onStart: () => setLoading(true), onFinish: () => setLoading(false) });
    }

    return <div style={{ '--module-accent': 'var(--habit-accent)' } as CSSProperties}>
        <Head title={`${habit.name} statistics`} />
        <div className="mx-auto max-w-6xl">
            <Link className="focus-ring mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-muted hover:text-foreground" href={habit.archived ? '/habits/archived' : '/habits'}><ArrowLeft aria-hidden="true" size={16} />Back to habits</Link>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--module-accent)]">Habit statistics{habit.archived ? ' · Archived' : ''}</p>
            <h1 className="break-words text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{habit.name}</h1>
            <p className="mb-8 mt-3 text-sm text-muted">Your consistency, streaks, and progress over time.</p>
            <section aria-busy={loading} aria-label="Habit statistics" className={`space-y-5 ${loading ? 'opacity-60' : ''}`}>
                <Surface className="p-1"><div aria-label="Statistics period" className="grid grid-cols-4 gap-1" role="group">{([['season', 'Season'], ['month', 'Month'], ['year', 'Year'], ['all', 'All time']] as const).map(([key, label]) => <button aria-pressed={statistics.filter === key} className={`focus-ring min-h-11 rounded-[1.35rem] px-2 text-sm font-bold ${statistics.filter === key ? 'bg-[var(--module-accent)] text-black' : 'text-muted hover:bg-surface-hover'}`} disabled={loading} key={key} onClick={() => visitPeriod(key)} type="button">{label}</button>)}</div></Surface>
                <div className="flex items-center justify-center gap-4">
                    {statistics.filter !== 'all' && <button aria-label="Previous period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-border-subtle disabled:opacity-30" disabled={loading || !statistics.selector.previousValue} onClick={() => visitPeriod(statistics.filter, statistics.selector.previousValue)} type="button"><ChevronLeft aria-hidden="true" size={20} /></button>}
                    <div className="text-center"><h2 className="text-2xl font-bold">{statistics.label}</h2>{statistics.comparisonLabel && <p className="mt-1 text-xs text-muted">{statistics.comparisonLabel}</p>}</div>
                    {statistics.filter !== 'all' && <button aria-label="Next period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full border border-border-subtle disabled:opacity-30" disabled={loading || !statistics.selector.nextValue} onClick={() => visitPeriod(statistics.filter, statistics.selector.nextValue)} type="button"><ChevronRight aria-hidden="true" size={20} /></button>}
                </div>
                <div className={`grid grid-cols-2 gap-3 ${numeric ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                    {metrics.map(({ key, label, detail }) => <Surface className="min-w-0 p-4 sm:p-5" key={key}>
                        <h3 className="text-sm font-bold text-secondary">{label}</h3>
                        <p className="mt-4 break-words text-4xl font-bold tracking-tight">{formatStatistic(statistics.current[key])}{key === 'completionRate' && statistics.current[key] !== null ? '%' : ''}</p>
                        <p className="mt-2 text-xs leading-5 text-muted">{detail}</p>
                        {statistics.filter !== 'all' && <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border-subtle pt-3 text-xs font-semibold"><span className="text-muted">Previous {formatStatistic(statistics.previous?.[key] ?? null)}{key === 'completionRate' && statistics.previous?.[key] != null ? '%' : ''}</span><Delta current={statistics.current[key]} percentage={key === 'completionRate'} previous={statistics.previous?.[key] ?? null} /></div>}
                    </Surface>)}
                    <Surface className="min-w-0 p-4 sm:p-5"><h3 className="text-sm font-bold text-secondary">Current streak</h3><p className="mt-4 text-4xl font-bold tracking-tight text-[var(--module-accent)]">{statistics.currentStreak}</p><p className="mt-2 text-xs text-muted">Current overall · skipped days preserve streaks</p></Surface>
                </div>
                <HabitStatisticsCharts numeric={numeric} statistics={statistics} unit={habit.unit} />
                <HabitStatisticsCalendar key={`${statistics.filter}-${statistics.selector.value}`} statistics={statistics} unit={habit.unit} />
            </section>
        </div>
    </div>;
}
