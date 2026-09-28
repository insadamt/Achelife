import { CheckCheck, Medal, Percent, Sigma, TrendingUp } from 'lucide-react';

import { Surface } from '../../components/ui';
import { StatisticDelta } from '../../components/ui/StatisticDelta';
import { formatStatistic } from './statisticsTypes';
import type { HabitStatisticsData, HabitStatisticsTotals } from './statisticsTypes';

export function HabitStatisticCards({ statistics, numeric, unit }: { statistics: HabitStatisticsData; numeric: boolean; unit: string | null }) {
    const metrics: { key: keyof HabitStatisticsTotals; label: string; detail: string; icon: typeof Percent }[] = [
        { key: 'completionRate', label: 'Completion rate', detail: 'Of completed + missed scheduled days', icon: Percent },
        { key: 'completed', label: 'Times completed', detail: statistics.current.extras ? `Includes ${statistics.current.extras} flexible extras` : 'Completions in this period', icon: CheckCheck },
        { key: 'bestStreak', label: 'Best streak', detail: 'Within the selected period', icon: Medal },
        ...(numeric ? [
            { key: 'total' as const, label: 'Total recorded', detail: `${unit ?? 'Units'} · includes partial entries`, icon: Sigma },
            { key: 'average' as const, label: 'Daily average', detail: `${unit ?? 'Units'} · per recorded day`, icon: TrendingUp },
        ] : []),
    ];

    return (
        <div className={`grid grid-cols-2 gap-3 ${numeric ? 'lg:grid-cols-5' : 'sm:grid-cols-3'}`}>
            {metrics.map(({ key, label, detail, icon: Icon }, index) => (
                <Surface className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5 ${index === 0 ? 'col-span-2 border-[color-mix(in_srgb,var(--module-accent)_30%,var(--border-subtle))] sm:col-span-1' : ''}`} key={key}>
                    {index === 0 && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--module-accent)]" />}
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold text-secondary">{label}</h3>
                        <Icon aria-hidden="true" className={index === 0 ? 'shrink-0 text-accent-ink' : 'shrink-0 text-muted'} size={16} />
                    </div>
                    <p className="mt-5 break-words text-3xl font-bold tracking-[-0.05em] tabular-nums sm:text-4xl">
                        {formatStatistic(statistics.current[key])}
                        {key === 'completionRate' && statistics.current[key] !== null && <span className="ml-1 text-xl text-muted">%</span>}
                    </p>
                    {key === 'completionRate' && <div aria-hidden="true" className="mt-3 h-1 overflow-hidden rounded-full bg-elevated"><div className="h-full rounded-full bg-[var(--module-accent)]" style={{ width: `${statistics.current.completionRate ?? 0}%` }} /></div>}
                    <p className="mb-4 mt-2 text-xs leading-5 text-muted">{detail}</p>
                    {statistics.filter !== 'all' && (
                        <div className="mt-auto space-y-1.5 border-t border-border-subtle pt-3 text-xs font-semibold">
                            <StatisticDelta current={statistics.current[key]} formatValue={(value) => `${formatStatistic(value)}${key === 'completionRate' ? '%' : ''}`} percentagePoints={key === 'completionRate'} previous={statistics.previous?.[key] ?? null} />
                        </div>
                    )}
                </Surface>
            ))}
        </div>
    );
}
