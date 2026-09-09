import { router } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, CheckCheck, ChevronLeft, ChevronRight, Clock3, Minus, Star, Zap } from 'lucide-react';
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
            <Surface className="overflow-hidden p-1">
                <div aria-label="Statistics period" className="grid grid-cols-4 gap-1" role="group">
                    {filters.map(([key, label]) => (
                        <button aria-pressed={statistics.filter === key} className={`focus-ring min-h-11 rounded-[1.35rem] px-2 text-sm font-bold transition-all ${statistics.filter === key ? 'bg-[var(--module-accent)] text-accent-foreground shadow-lg' : 'text-muted hover:bg-surface-hover hover:text-foreground'}`} disabled={loading} key={key} onClick={() => changeFilter(key)} type="button">{label}</button>
                    ))}
                </div>
            </Surface>

            <div className="flex justify-center">
                {statistics.filter === 'all' ? (
                    <div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Selected period</p><h2 className="mt-1 text-2xl font-bold tracking-tight" id="task-statistics-heading">All time</h2></div>
                ) : (
                    <div className="grid grid-cols-[2.75rem_minmax(11rem,1fr)_2.75rem] items-center gap-2">
                        <button aria-label="Previous period" className="focus-ring grid size-11 place-items-center rounded-full border border-border-subtle bg-surface text-secondary transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30" disabled={!statistics.selector.previousValue || loading} onClick={() => changeSelectedPeriod(statistics.selector.previousValue)} type="button"><ChevronLeft aria-hidden="true" size={20} /></button>
                        <div className="text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-ink">Selected period</p>
                            <h2 className="mt-1 text-2xl font-bold tracking-tight" id="task-statistics-heading">{statistics.label}</h2>
                            <p className="mt-1 text-xs font-semibold text-muted">{statistics.comparisonLabel}</p>
                        </div>
                        <button aria-label="Next period" className="focus-ring grid size-11 place-items-center rounded-full border border-border-subtle bg-surface text-secondary transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30" disabled={!statistics.selector.nextValue || loading} onClick={() => changeSelectedPeriod(statistics.selector.nextValue)} type="button"><ChevronRight aria-hidden="true" size={20} /></button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {metrics.map(({ key, label, detail, icon: Icon }, index) => {
                    const percentage = key === 'onTime';
                    const previous = statistics.previous?.[key] ?? null;

                    return (
                        <Surface className={`relative min-w-0 overflow-hidden p-4 sm:p-5 ${index === 0 ? 'border-[color-mix(in_srgb,var(--module-accent)_28%,var(--border-subtle))]' : ''}`} key={key}>
                            {index === 0 && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--module-accent)]" />}
                            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-secondary">{label}</h3><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)] text-accent-ink"><Icon aria-hidden="true" size={18} /></span></div>
                            <p className="mt-4 text-4xl font-bold leading-none tracking-[-0.04em]">{formatMetric(statistics.current[key], percentage)}</p>
                            <p className="mt-2 text-xs text-muted">{detail}</p>
                            {statistics.filter !== 'all' && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3"><span className="text-xs text-muted">Previous {formatMetric(previous, percentage)}</span><MetricDelta current={statistics.current[key]} percentage={percentage} previous={previous} /></div>}
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
