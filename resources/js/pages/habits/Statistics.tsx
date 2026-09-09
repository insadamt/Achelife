import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Flame, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Surface } from '../../components/ui';
import { HabitStatisticCards } from '../../features/habits/HabitStatisticCards';
import { HabitStatisticsCalendar } from '../../features/habits/HabitStatisticsCalendar';
import { HabitStatisticsCharts } from '../../features/habits/HabitStatisticsCharts';
import type { HabitStatisticsData } from '../../features/habits/statisticsTypes';

interface HabitIdentity {
    id: number;
    name: string;
    type: 'boolean' | 'numeric';
    unit: string | null;
    archived: boolean;
}

const periods = [['season', 'Season'], ['month', 'Month'], ['year', 'Year'], ['all', 'All time']] as const;

export default function HabitStatisticsPage({ habit, statistics }: { habit: HabitIdentity; statistics: HabitStatisticsData }) {
    const [loading, setLoading] = useState(false);
    const numeric = habit.type === 'numeric';

    function visitPeriod(filter: HabitStatisticsData['filter'], value?: string | null) {
        const url = new URL(window.location.href);
        url.searchParams.set('statistics_period', filter);
        if (value) url.searchParams.set('statistics_value', value);
        else url.searchParams.delete('statistics_value');
        router.get(`${url.pathname}${url.search}`, {}, {
            only: ['statistics'], preserveScroll: true, preserveState: true,
            onStart: () => setLoading(true), onFinish: () => setLoading(false),
        });
    }

    return (
        <div style={{ '--module-accent': 'var(--habit-accent)' } as CSSProperties}>
            <Head title={`${habit.name} statistics`} />
            <div className="mx-auto max-w-6xl">
                <Link className="focus-ring mb-6 inline-flex min-h-10 items-center gap-2 rounded-xl border border-border-subtle px-3 text-xs font-semibold text-secondary hover:bg-surface-hover hover:text-foreground" href={habit.archived ? '/habits/archived' : '/habits'}>
                    <ArrowLeft aria-hidden="true" size={15} />Back to habits
                </Link>
                <header className="mb-7 flex flex-wrap items-end justify-between gap-5">
                    <div className="min-w-0 flex-1">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Habit statistics{habit.archived ? ' · Archived' : ''}</p>
                        <h1 className="break-words text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{habit.name}</h1>
                        <p className="mt-3 text-sm text-muted">See your consistency take shape.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border-subtle bg-elevated px-4 py-3">
                        <Flame aria-hidden="true" className="text-accent-ink" size={24} />
                        <strong className="text-3xl font-bold tracking-tight tabular-nums">{statistics.currentStreak}</strong>
                        <div><p className="text-xs font-bold">Current streak</p><p className="mt-0.5 text-xs text-muted">Overall, as of today</p></div>
                    </div>
                </header>

                <section aria-busy={loading} aria-label="Habit statistics" className="space-y-5">
                    <Surface className="rounded-2xl p-3 sm:p-4">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div aria-label="Statistics period" className="grid grid-cols-4 gap-1 rounded-xl bg-app p-1 lg:min-w-80" role="group">
                                {periods.map(([key, label]) => (
                                    <button aria-pressed={statistics.filter === key} className={`focus-ring min-h-10 rounded-lg px-3 text-xs font-bold transition-colors ${statistics.filter === key ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`} disabled={loading} key={key} onClick={() => visitPeriod(key)} type="button">{label}</button>
                                ))}
                            </div>
                            <div className="flex items-center justify-between gap-3 lg:justify-end">
                                {statistics.filter !== 'all' && <button aria-label="Previous period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-border-subtle hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30" disabled={loading || !statistics.selector.previousValue} onClick={() => visitPeriod(statistics.filter, statistics.selector.previousValue)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>}
                                <div className="min-w-36 flex-1 text-center lg:flex-none">
                                    <h2 className="inline-flex items-center gap-2 text-base font-bold">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <CalendarDays aria-hidden="true" className="text-muted" size={15} />}{statistics.label}</h2>
                                    <p aria-live="polite" className="mt-1 text-xs text-muted">{loading ? 'Updating statistics…' : statistics.comparisonLabel ?? 'Your complete habit history'}</p>
                                </div>
                                {statistics.filter !== 'all' && <button aria-label="Next period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-border-subtle hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30" disabled={loading || !statistics.selector.nextValue} onClick={() => visitPeriod(statistics.filter, statistics.selector.nextValue)} type="button"><ChevronRight aria-hidden="true" size={18} /></button>}
                            </div>
                        </div>
                    </Surface>
                    <div className={`space-y-5 transition-opacity ${loading ? 'pointer-events-none opacity-50' : ''}`} inert={loading}>
                        <HabitStatisticCards numeric={numeric} statistics={statistics} unit={habit.unit} />
                        <HabitStatisticsCharts numeric={numeric} statistics={statistics} unit={habit.unit} />
                        <HabitStatisticsCalendar key={`${statistics.filter}-${statistics.selector.value}`} statistics={statistics} unit={habit.unit} />
                    </div>
                </section>
            </div>
        </div>
    );
}
