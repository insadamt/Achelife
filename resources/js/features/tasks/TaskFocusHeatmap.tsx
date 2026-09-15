import { CalendarDays } from 'lucide-react';

import { Surface } from '../../components/ui';
import { formatFocusDurationLong } from './taskStatisticsPresentation';
import type { TaskFocusStatisticsData } from './taskStatisticsTypes';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function intensity(seconds: number, maximum: number): string {
    if (seconds === 0) return 'border-border-subtle bg-app/60';
    const ratio = seconds / maximum;
    if (ratio <= 0.25) return 'border-[color-mix(in_srgb,var(--module-accent)_24%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_18%,var(--surface-primary))]';
    if (ratio <= 0.5) return 'border-[color-mix(in_srgb,var(--module-accent)_38%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_36%,var(--surface-primary))]';
    if (ratio <= 0.75) return 'border-[color-mix(in_srgb,var(--module-accent)_62%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_58%,var(--surface-primary))]';
    return 'border-[var(--module-accent)] bg-[var(--module-accent)] text-accent-foreground';
}

export function TaskFocusHeatmap({ heatmap }: { heatmap: TaskFocusStatisticsData['heatmap'] }) {
    const maximum = Math.max(1, ...heatmap.days.map((day) => day.seconds));
    const firstWeekday = (new Date(`${heatmap.startDate}T00:00:00Z`).getUTCDay() + 6) % 7;
    const cells = [...Array.from({ length: firstWeekday }, () => null), ...heatmap.days];
    const columns = Math.max(1, Math.ceil(cells.length / 7));

    return <Surface className="min-w-0 rounded-3xl p-4 sm:p-6">
        <div className="mb-5"><h3 className="flex items-center gap-2 text-lg font-bold"><CalendarDays aria-hidden="true" className="text-accent-ink" size={18} />Daily Focus</h3><p className="mt-1 text-sm text-muted">Profile-local days from {heatmap.startDate} to {heatmap.endDate}</p></div>
        <div className="flex min-w-0 gap-2">
            <div aria-hidden="true" className="grid shrink-0 grid-rows-7 gap-1.5 py-px">{weekdayLabels.map((day, index) => <span className={`h-4 text-[0.55rem] font-bold uppercase leading-4 text-muted ${index % 2 === 1 ? 'opacity-0' : ''}`} key={day}>{day.slice(0, 1)}</span>)}</div>
            <div aria-label="Daily Focus heatmap" className="focus-ring min-w-0 flex-1 overflow-x-auto rounded-lg pb-2" role="region" tabIndex={0}>
                <div className="grid w-max grid-flow-col grid-rows-7 gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(1rem, 1rem))` }}>
                    {cells.map((day, index) => day === null
                        ? <span aria-hidden="true" className="size-4" key={`blank-${index}`} />
                        : <button aria-label={`${day.date}: ${formatFocusDurationLong(day.seconds)} of completed Focus Time`} className={`focus-ring size-4 rounded-[0.28rem] border ${intensity(day.seconds, maximum)}`} key={day.date} title={`${day.date} · ${formatFocusDurationLong(day.seconds)}`} type="button" />)}
                </div>
            </div>
        </div>
        <div aria-label="Focus intensity legend" className="mt-3 flex items-center justify-end gap-1.5 text-[0.65rem] text-muted"><span>Less</span>{[0, 0.2, 0.45, 0.7, 1].map((ratio) => <span aria-hidden="true" className={`size-3 rounded-[0.2rem] border ${intensity(maximum * ratio, maximum)}`} key={ratio} />)}<span>More</span></div>
    </Surface>;
}
