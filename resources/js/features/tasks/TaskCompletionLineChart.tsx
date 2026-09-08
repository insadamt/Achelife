import { useId, useState } from 'react';

interface TrendBucket {
    date: string;
    label: string;
    count: number;
    sp: number;
}

interface TaskCompletionLineChartProps {
    buckets: TrendBucket[];
    unit: 'day' | 'month' | 'year';
    metric: 'tasks' | 'sp';
}

const chartWidth = 800;
const chartHeight = 280;
const padding = { top: 24, right: 18, bottom: 38, left: 42 };

export function TaskCompletionLineChart({ buckets, metric, unit }: TaskCompletionLineChartProps) {
    const gradientId = useId().replace(/:/g, '');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const metricLabel = metric === 'tasks' ? 'completed tasks' : 'Task SP earned';
    const values = buckets.map((bucket) => metric === 'tasks' ? bucket.count : bucket.sp);
    const maxValue = Math.max(1, ...values);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const points = buckets.map((bucket, index) => ({
        ...bucket,
        value: values[index] ?? 0,
        x: padding.left + (buckets.length === 1 ? plotWidth / 2 : index / (buckets.length - 1) * plotWidth),
        y: padding.top + plotHeight - (values[index] ?? 0) / maxValue * plotHeight,
    }));
    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const firstPoint = points[0];
    const lastPoint = points.at(-1);
    const areaPath = points.length > 0
        ? `${linePath} L ${lastPoint?.x} ${padding.top + plotHeight} L ${firstPoint?.x} ${padding.top + plotHeight} Z`
        : '';
    const labelStep = Math.max(1, Math.ceil(buckets.length / 6));
    const yTicks = [1, 0.75, 0.5, 0.25, 0];

    return (
        <div>
            <div className="relative overflow-x-auto pb-1">
                <svg aria-label={`Line chart of ${metricLabel} per ${unit}`} className="h-auto min-w-[620px] w-full" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--module-accent)" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="var(--module-accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {yTicks.map((ratio) => {
                        const y = padding.top + plotHeight * (1 - ratio);

                        return <g key={ratio}><line stroke="var(--border-subtle)" strokeDasharray={ratio === 0 ? undefined : '4 8'} x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} /><text fill="var(--text-muted)" fontSize="11" textAnchor="end" x={padding.left - 10} y={y + 4}>{Math.round(maxValue * ratio)}</text></g>;
                    })}
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path d={linePath} fill="none" stroke="var(--module-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                    {points.map((point, index) => {
                        const active = activeIndex === index;
                        const tooltipX = Math.min(chartWidth - 66, Math.max(66, point.x));
                        const tooltipY = Math.max(2, point.y - 56);

                        return (
                            <g aria-label={`${point.label}: ${point.value} ${metric === 'tasks' ? `completed ${point.value === 1 ? 'task' : 'tasks'}` : 'Task SP earned'}`} key={point.date} onBlur={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} role="button" tabIndex={0}>
                                <circle className="cursor-pointer" cx={point.x} cy={point.y} fill="transparent" r="14" />
                                <circle cx={point.x} cy={point.y} fill={active ? 'var(--module-accent)' : 'var(--surface-primary)'} r={active ? 6 : 4} stroke="var(--module-accent)" strokeWidth="3" />
                                {active && <g aria-hidden="true"><rect fill="var(--surface-elevated)" height="44" rx="10" stroke="var(--border-strong)" width="116" x={tooltipX - 58} y={tooltipY} /><text fill="var(--text-secondary)" fontSize="10" textAnchor="middle" x={tooltipX} y={tooltipY + 15}>{point.label}</text><text fill="var(--text-primary)" fontSize="14" fontWeight="700" textAnchor="middle" x={tooltipX} y={tooltipY + 33}>{point.value} {metric === 'tasks' ? 'completed' : 'SP'}</text></g>}
                            </g>
                        );
                    })}
                    {points.map((point, index) => {
                        const show = index === 0 || index === points.length - 1 || index % labelStep === 0;

                        return show ? <text fill="var(--text-muted)" fontSize="10" key={point.date} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} x={point.x} y={chartHeight - 10}>{point.label}</text> : null;
                    })}
                </svg>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">Follow the line to see your productive peaks and quiet stretches. Hover or focus a point for its exact {metric === 'tasks' ? 'task' : 'SP'} total.</p>
        </div>
    );
}
