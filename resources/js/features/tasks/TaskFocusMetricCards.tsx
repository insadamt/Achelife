import { CalendarClock, Clock3, History, Timer, Trophy } from 'lucide-react';

import { Surface } from '../../components/ui';
import { StatisticDelta } from '../../components/ui/StatisticDelta';
import { formatFocusDuration } from './taskStatisticsPresentation';
import type { TaskFocusStatisticsData, TaskFocusStatisticsTotals } from './taskStatisticsTypes';

const metrics = [
    { key: 'totalSeconds', label: 'Total Focus', detail: 'Completed Focus Time', icon: Timer },
    { key: 'sessionCount', label: 'Sessions', detail: 'Completed sessions', icon: History },
    { key: 'averageSessionSeconds', label: 'Average Session', detail: 'Focus per session', icon: Clock3 },
    { key: 'averageActiveDaySeconds', label: 'Average Active Day', detail: 'Focus per active day', icon: CalendarClock },
    { key: 'longestSessionSeconds', label: 'Longest Session', detail: 'Most Focus in one session', icon: Trophy },
] as const;

function metricValue(key: keyof TaskFocusStatisticsTotals, value: number): string {
    return key === 'sessionCount' ? value.toLocaleString() : formatFocusDuration(value);
}

export function TaskFocusMetricCards({ focus, compare }: { focus: TaskFocusStatisticsData; compare: boolean }) {
    return <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {metrics.map(({ key, label, detail, icon: Icon }, index) => {
            const current = focus.current[key];
            const previous = focus.previous?.[key] ?? null;

            return <Surface className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5 ${index === 0 ? 'col-span-2 border-[color-mix(in_srgb,var(--module-accent)_30%,var(--border-subtle))] lg:col-span-1' : ''}`} key={key}>
                {index === 0 && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--module-accent)]" />}
                <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-secondary">{label}</h3><Icon aria-hidden="true" className={index === 0 ? 'text-accent-ink' : 'text-muted'} size={16} /></div>
                <p className="mt-5 text-2xl font-bold leading-none tracking-[-0.045em] tabular-nums sm:text-3xl">{metricValue(key, current)}</p>
                <p className="mb-4 mt-2 text-xs leading-5 text-muted">{detail}</p>
                {compare && <div className="mt-auto space-y-1.5 border-t border-border-subtle pt-3"><StatisticDelta current={current} formatValue={(value) => metricValue(key, value)} previous={previous} /></div>}
            </Surface>;
        })}
    </div>;
}
