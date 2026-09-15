import { Activity, TimerReset } from 'lucide-react';

import { Surface } from '../../components/ui';
import { TaskFocusHeatmap } from './TaskFocusHeatmap';
import { TaskFocusLineChart } from './TaskFocusLineChart';
import { TaskFocusMetricCards } from './TaskFocusMetricCards';
import { TaskFocusRankings } from './TaskFocusRankings';
import type { TaskFocusStatisticsData } from './taskStatisticsTypes';

export function TaskFocusStatisticsPanel({ focus, compare }: { focus: TaskFocusStatisticsData; compare: boolean }) {
    return <section aria-labelledby="focus-statistics-heading" className="space-y-5 pt-5">
        <div><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-ink"><TimerReset aria-hidden="true" size={15} />Focus analytics</p><h2 className="text-2xl font-bold tracking-[-0.035em]" id="focus-statistics-heading">Time spent moving Tasks forward</h2><p className="mt-2 text-sm text-muted">Only completed Focus Sessions count. Running and paused timers stay out until stopped.</p></div>
        <TaskFocusMetricCards compare={compare} focus={focus} />
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
            <Surface className="min-w-0 rounded-3xl p-4 sm:p-6">
                <div className="mb-4"><h3 className="flex items-center gap-2 text-lg font-bold"><Activity aria-hidden="true" className="text-accent-ink" size={18} />Focus activity</h3><p className="mt-1 text-sm text-muted">Completed Focus Time per {focus.trend.unit}</p></div>
                {focus.current.totalSeconds === 0 ? <p className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 px-5 text-center text-sm text-muted">Completed Focus Sessions will form your activity line here.</p> : <TaskFocusLineChart trend={focus.trend} />}
            </Surface>
            <TaskFocusHeatmap heatmap={focus.heatmap} />
        </div>
        <TaskFocusRankings focus={focus} />
    </section>;
}
