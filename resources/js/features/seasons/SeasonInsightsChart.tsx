import { useId } from 'react';

import type { SeasonTimelinePoint } from './insightsTypes';

const width = 440;
const height = 190;
const padding = { top: 18, right: 12, bottom: 28, left: 38 };

export function SeasonInsightsChart({ current, previous }: { current: SeasonTimelinePoint[]; previous: SeasonTimelinePoint[] | null }) {
    const gradientId = useId().replace(/:/g, '');
    const values = [...current, ...(previous ?? [])].map((point) => point.cumulativeSp);
    const minimum = Math.min(0, ...values);
    const maximum = Math.max(1, ...values);
    const range = Math.max(1, maximum - minimum);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const x = (day: number) => padding.left + (day - 1) / 29 * plotWidth;
    const y = (value: number) => padding.top + (maximum - value) / range * plotHeight;
    const path = (points: SeasonTimelinePoint[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.day)} ${y(point.cumulativeSp)}`).join(' ');
    const currentPath = path(current);
    const currentLast = current.at(-1);
    const zeroY = y(0);
    const areaPath = currentLast ? `${currentPath} L ${x(currentLast.day)} ${zeroY} L ${x(1)} ${zeroY} Z` : '';

    return (
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-app/45 p-3">
            <svg aria-label="Cumulative Season Points by Season day" className="h-auto w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
                <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--module-accent)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--module-accent)" stopOpacity="0" /></linearGradient></defs>
                {[minimum, minimum + range / 2, maximum].map((value) => <g key={value}><line stroke="var(--border-subtle)" strokeDasharray="4 7" x1={padding.left} x2={width - padding.right} y1={y(value)} y2={y(value)} /><text fill="var(--text-muted)" fontSize="10" textAnchor="end" x={padding.left - 7} y={y(value) + 3}>{Math.round(value)}</text></g>)}
                {minimum < 0 && maximum > 0 && <line stroke="var(--border-strong)" x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} />}
                {previous && <path d={path(previous)} fill="none" stroke="var(--text-muted)" strokeDasharray="5 6" strokeLinecap="round" strokeWidth="2" />}
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={currentPath} fill="none" stroke="var(--module-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                {currentLast && <circle cx={x(currentLast.day)} cy={y(currentLast.cumulativeSp)} fill="var(--surface-elevated)" r="5" stroke="var(--module-accent)" strokeWidth="3" />}
                {[1, 10, 20, 30].map((day) => <text fill="var(--text-muted)" fontSize="10" key={day} textAnchor={day === 1 ? 'start' : day === 30 ? 'end' : 'middle'} x={x(day)} y={height - 8}>Day {day}</text>)}
            </svg>
        </div>
    );
}
