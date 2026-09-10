import { Activity, BookOpen, ChartNoAxesCombined, Gavel, ListChecks, LoaderCircle, Repeat2, Target, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { formatSeasonRange } from './dateFormat';
import { SeasonInsightsChart } from './SeasonInsightsChart';
import type { SeasonChartView } from './SeasonInsightsChart';
import type { SeasonInsightsData } from './insightsTypes';
import type { SeasonViewData } from './types';

const contributions = [
    { key: 'tasks', label: 'Tasks', icon: ListChecks },
    { key: 'habits', label: 'Habits', icon: Repeat2 },
    { key: 'diary', label: 'Diary', icon: BookOpen },
    { key: 'objectives', label: 'Objectives', icon: Target },
    { key: 'constitution', label: 'Constitution', icon: Gavel },
] as const;

function formatSigned(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toLocaleString()} SP`;
}

export function SeasonStatsPanel({ season }: { season: SeasonViewData }) {
    const [insights, setInsights] = useState<SeasonInsightsData | null>(null);
    const [error, setError] = useState(false);
    const [requestAttempt, setRequestAttempt] = useState(0);
    const [chartView, setChartView] = useState<SeasonChartView>('cumulative');

    useEffect(() => {
        if (season.id === null) return;

        const controller = new AbortController();

        fetch(`/seasons/${season.id}/insights`, { headers: { Accept: 'application/json' }, signal: controller.signal })
            .then((response) => {
                if (!response.ok) throw new Error('Unable to load Season stats.');
                return response.json() as Promise<SeasonInsightsData>;
            })
            .then(setInsights)
            .catch((requestError: unknown) => {
                if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) setError(true);
            });

        return () => controller.abort();
    }, [requestAttempt, season.id]);

    const historical = season.state === 'completed';

    function retryLoading() {
        setInsights(null);
        setError(false);
        setRequestAttempt((attempt) => attempt + 1);
    }

    if (!insights && !error) {
        return <Surface aria-live="polite" className="grid min-h-96 place-items-center p-6 text-center" elevated><div><LoaderCircle aria-hidden="true" className="mx-auto animate-spin text-accent-ink" size={30} /><p className="mt-3 font-bold">Reading Season {season.number}</p><p className="mt-1 text-sm text-muted">Building your trajectory and outcomes…</p></div></Surface>;
    }

    if (error || !insights) {
        return <Surface className="grid min-h-96 place-items-center p-6 text-center" elevated><div><ChartNoAxesCombined aria-hidden="true" className="mx-auto text-muted" size={30} /><p className="mt-3 font-bold">Stats could not load</p><p className="mt-1 text-sm text-muted">Try loading this Season again.</p><Button className="mt-4" onClick={retryLoading} size="small" variant="secondary">Try again</Button></div></Surface>;
    }

    const previousAtSameDay = insights.previousTimeline?.[Math.max(0, insights.elapsedDays - 1)]?.cumulativeSp;
    const currentAtSameDay = insights.timeline.at(-1)?.cumulativeSp ?? 0;
    const comparison = previousAtSameDay === undefined ? null : currentAtSameDay - previousAtSameDay;
    const breakdownMaximum = Math.max(1, ...Object.values(insights.summary.breakdown).map(Math.abs));
    const snapshot = [
        ['Season SP', insights.summary.seasonPoints.toLocaleString()],
        [historical ? 'Daily average' : 'SP today', historical ? insights.averageSpPerDay.toLocaleString() : formatSigned(insights.spToday)],
        ['Elapsed', `${insights.elapsedDays} days`],
    ];

    return (
        <div className="space-y-5">
            <Surface className="p-5 sm:p-7" elevated>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs font-bold tracking-[0.18em] text-accent-ink uppercase">Season {String(season.number).padStart(2, '0')} stats</p>
                            <StatusChip status={historical ? 'completed' : 'active'}>{historical ? 'Final' : 'Live'}</StatusChip>
                        </div>
                        <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{historical ? 'Season report' : 'Season performance'}</h2>
                        <p className="mt-1 text-sm font-semibold text-secondary">{formatSeasonRange(season.startDate, season.endDate)}</p>
                    </div>
                    {comparison !== null && <div className="rounded-2xl border border-border-subtle bg-app/55 px-4 py-3 text-right"><p className={`text-lg font-bold tabular-nums ${comparison >= 0 ? 'text-success' : 'text-danger'}`}>{comparison > 0 ? '+' : ''}{comparison.toLocaleString()} SP</p><p className="text-xs text-muted">vs previous Season at Day {insights.elapsedDays}</p></div>}
                </div>

                <section aria-label="Season snapshot" className="mt-6 grid gap-3 sm:grid-cols-3">
                    {snapshot.map(([label, value]) => <div className="rounded-2xl border border-border-subtle bg-app/55 p-4" key={label}><p className="text-[0.65rem] font-bold tracking-[0.13em] text-muted uppercase">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums">{value}</p></div>)}
                </section>
            </Surface>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)]">
                <Surface className="min-w-0 overflow-hidden p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><h3 className="flex items-center gap-2 text-lg font-bold"><Activity aria-hidden="true" className="text-accent-ink" size={19} />SP trajectory</h3><p className="mt-1 text-sm text-muted">{chartView === 'cumulative' ? 'Cumulative points across the 30-day Season' : 'Net SP earned or lost on each Season day'}</p></div>
                        <div aria-label="Season chart view" className="flex gap-1 rounded-full border border-border-subtle bg-app p-1" role="group">
                            <button aria-pressed={chartView === 'cumulative'} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${chartView === 'cumulative' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:text-foreground'}`} onClick={() => setChartView('cumulative')} type="button">Cumulative</button>
                            <button aria-pressed={chartView === 'daily'} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${chartView === 'daily' ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:text-foreground'}`} onClick={() => setChartView('daily')} type="button">Daily SP</button>
                        </div>
                    </div>
                    <div className="mt-5"><SeasonInsightsChart current={insights.timeline} previous={insights.previousTimeline} view={chartView} /></div>
                    {insights.previousTimeline && <div className="mt-3 flex justify-end gap-4 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[var(--module-accent)]" />Selected</span><span className="flex items-center gap-1.5"><span className="w-5 border-t-2 border-dashed border-border-strong" />Previous</span></div>}
                </Surface>

                <Surface className="p-5 sm:p-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold"><Zap aria-hidden="true" className="text-accent-ink" size={19} />SP sources</h3>
                    <div className="mt-4 space-y-3">
                        {contributions.map(({ key, label, icon: Icon }) => { const value = insights.summary.breakdown[key]; return <div key={key}><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-semibold text-secondary"><Icon aria-hidden="true" size={15} />{label}</span><strong className={value < 0 ? 'text-danger' : ''}>{formatSigned(value)}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle"><div className={`h-full rounded-full ${value < 0 ? 'bg-danger' : 'bg-[var(--module-accent)]'}`} style={{ width: `${Math.abs(value) / breakdownMaximum * 100}%` }} /></div></div>; })}
                    </div>
                </Surface>
            </div>

            <Surface className="p-5 sm:p-6">
                <h3 className="text-lg font-bold">Season in practice</h3>
                <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-5">
                    {[
                        ['Objectives completed', `${insights.summary.metrics.objectivesCompleted} / ${insights.summary.metrics.objectivesTotal}`],
                        ['Tasks resolved', `${insights.summary.metrics.tasksResolved} / ${insights.summary.metrics.tasksTotal}`],
                        ['Habit adherence', `${insights.summary.metrics.habitAdherencePercent}%`],
                        ['Diary days', insights.summary.metrics.diaryDays.toLocaleString()],
                        ['Constitution violations', insights.summary.metrics.constitutionViolations.toLocaleString()],
                    ].map(([label, value]) => <div className="bg-surface p-4" key={label}><dt className="text-xs font-semibold text-muted">{label}</dt><dd className="mt-2 text-xl font-bold tabular-nums">{value}</dd></div>)}
                </dl>
            </Surface>
        </div>
    );
}
