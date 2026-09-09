import { router } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, CheckCheck, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Minus, Star, Zap } from 'lucide-react';
import { useState } from 'react';

import { Surface } from '../../components/ui';
import { TaskCompletionLineChart } from './TaskCompletionLineChart';

interface Totals {
    completed: number;
    sp: number;
    important: number;
    onTime: number | null;
}

export interface TaskStatisticsData {
    filter: 'season' | 'month' | 'year' | 'all';
    label: string;
    comparisonLabel: string | null;
    selector: {
        value: string | null;
        previousValue: string | null;
        nextValue: string | null;
    };
    current: Totals;
    previous: Totals | null;
    trend: { unit: 'day' | 'month' | 'year'; buckets: { date: string; label: string; count: number; sp: number }[] };
}

const filters = [['season', 'Season'], ['month', 'Month'], ['year', 'Year'], ['all', 'All time']] as const;
const metrics = [
    { key: 'completed', label: 'Completed', detail: 'Tasks finished', icon: CheckCheck },
    { key: 'sp', label: 'Task SP', detail: 'Points earned', icon: Zap },
    { key: 'onTime', label: 'On time', detail: 'Early or due-date finishes', icon: Clock3 },
    { key: 'important', label: 'Important', detail: 'Priority tasks finished', icon: Star },
] as const;
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

function formatMetric(value: number | null, percentage: boolean): string {
    return value === null ? '—' : `${number.format(value)}${percentage ? '%' : ''}`;
}

function MetricDelta({ current, previous, percentage }: { current: number | null; previous: number | null; percentage: boolean }) {
    if (current === null || previous === null) return <span className="text-xs font-semibold text-muted">No previous result</span>;

    const delta = Math.round((current - previous) * 10) / 10;
    const relativeChange = previous === 0 ? null : Math.round(delta / previous * 1000) / 10;
    const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
    const tone = delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-muted';
    const label = percentage
        ? `${delta > 0 ? '+' : ''}${number.format(delta)} pp`
        : previous === 0
            ? delta === 0 ? 'No change' : 'New'
            : `${relativeChange && relativeChange > 0 ? '+' : ''}${number.format(relativeChange ?? 0)}%`;

    return <span className={`icon-text inline-flex items-center gap-1 text-xs font-bold ${tone}`}><Icon aria-hidden="true" size={14} />{label}</span>;
}

export function TaskStatisticsPanel({ statistics }: { statistics: TaskStatisticsData }) {
    const [loading, setLoading] = useState(false);
    const [chartMetric, setChartMetric] = useState<'tasks' | 'sp'>('tasks');

    function changeFilter(filter: TaskStatisticsData['filter']) {
        const url = new URL(window.location.href);
        url.searchParams.set('statistics_period', filter);
        url.searchParams.delete('statistics_value');
        visitStatistics(url);
    }

    function changeSelectedPeriod(value: string | null) {
        if (!value) return;

        const url = new URL(window.location.href);
        url.searchParams.set('statistics_period', statistics.filter);
        url.searchParams.set('statistics_value', value);
        visitStatistics(url);
    }

    function visitStatistics(url: URL) {
        router.get(`${url.pathname}${url.search}`, {}, {
            only: ['statistics'],
            preserveScroll: true,
            preserveState: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    }

    return (
        <section aria-busy={loading} aria-labelledby="task-statistics-heading" className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
            <Surface className="rounded-2xl p-3 sm:p-4">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div aria-label="Statistics period" className="grid grid-cols-4 gap-1 rounded-xl bg-app p-1 lg:min-w-80" role="group">
                        {filters.map(([key, label]) => (
                            <button aria-pressed={statistics.filter === key} className={`focus-ring min-h-10 rounded-lg px-3 text-xs font-bold transition-colors ${statistics.filter === key ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`} disabled={loading} key={key} onClick={() => changeFilter(key)} type="button">{label}</button>
                        ))}
                    </div>
                    {statistics.filter === 'all' ? (
                        <div className="min-w-36 text-center"><h2 className="inline-flex items-center gap-2 text-base font-bold" id="task-statistics-heading">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <CalendarDays aria-hidden="true" className="text-muted" size={15} />}All time</h2><p aria-live="polite" className="mt-1 text-xs text-muted">Your complete task history</p></div>
                    ) : (
                        <div className="flex items-center justify-between gap-3 lg:justify-end">
                            <button aria-label="Previous period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-border-subtle hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30" disabled={!statistics.selector.previousValue || loading} onClick={() => changeSelectedPeriod(statistics.selector.previousValue)} type="button"><ChevronLeft aria-hidden="true" size={18} /></button>
                            <div className="min-w-36 flex-1 text-center lg:flex-none"><h2 className="inline-flex items-center gap-2 text-base font-bold" id="task-statistics-heading">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={15} /> : <CalendarDays aria-hidden="true" className="text-muted" size={15} />}{statistics.label}</h2><p aria-live="polite" className="mt-1 text-xs text-muted">{loading ? 'Updating statistics…' : statistics.comparisonLabel}</p></div>
                            <button aria-label="Next period" className="focus-ring grid size-11 shrink-0 place-items-center rounded-xl border border-border-subtle hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30" disabled={!statistics.selector.nextValue || loading} onClick={() => changeSelectedPeriod(statistics.selector.nextValue)} type="button"><ChevronRight aria-hidden="true" size={18} /></button>
                        </div>
                    )}
                </div>
            </Surface>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {metrics.map(({ key, label, detail, icon: Icon }, index) => {
                    const percentage = key === 'onTime';
                    const previous = statistics.previous?.[key] ?? null;

                    return (
                        <Surface className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5 ${index === 0 ? 'col-span-2 border-[color-mix(in_srgb,var(--module-accent)_30%,var(--border-subtle))] sm:col-span-1' : ''}`} key={key}>
                            {index === 0 && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--module-accent)]" />}
                            <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-secondary">{label}</h3><Icon aria-hidden="true" className={index === 0 ? 'shrink-0 text-accent-ink' : 'shrink-0 text-muted'} size={16} /></div>
                            <p className="mt-5 text-3xl font-bold leading-none tracking-[-0.05em] tabular-nums sm:text-4xl">{formatMetric(statistics.current[key], percentage)}</p>
                            <p className="mb-4 mt-2 text-xs leading-5 text-muted">{detail}</p>
                            {statistics.filter !== 'all' && <div className="mt-auto space-y-1.5 border-t border-border-subtle pt-3 text-xs font-semibold"><MetricDelta current={statistics.current[key]} percentage={percentage} previous={previous} /><p className="font-normal text-muted">Previous {formatMetric(previous, percentage)}</p></div>}
                        </Surface>
                    );
                })}
            </div>

            <Surface className="overflow-hidden p-4 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="text-lg font-bold">Activity trend</h3><p className="mt-1 text-sm text-muted">{chartMetric === 'tasks' ? 'Tasks completed' : 'Task SP earned'} per {statistics.trend.unit}</p></div>
                    <div aria-label="Chart metric" className="flex gap-1 rounded-full border border-border-subtle bg-app p-1" role="group">
                        <button aria-pressed={chartMetric === 'tasks'} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${chartMetric === 'tasks' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:text-foreground'}`} onClick={() => setChartMetric('tasks')} type="button">Tasks</button>
                        <button aria-pressed={chartMetric === 'sp'} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${chartMetric === 'sp' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:text-foreground'}`} onClick={() => setChartMetric('sp')} type="button">SP</button>
                    </div>
                </div>
                {statistics.current.completed === 0
                    ? <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 px-5 text-center"><div><CheckCheck aria-hidden="true" className="mx-auto text-muted" size={28} /><p className="mt-3 font-bold">No completions yet</p><p className="mt-1 text-sm text-muted">Completed tasks will form your activity line here.</p></div></div>
                    : <TaskCompletionLineChart buckets={statistics.trend.buckets} metric={chartMetric} unit={statistics.trend.unit} />}
            </Surface>
        </section>
    );
}
