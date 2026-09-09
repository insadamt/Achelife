import { useId, useState } from 'react';

import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';
import type { MoneyStatisticsData, MoneyTrendBucket } from './statisticsTypes';

type CashFlowMetric = 'income' | 'spending';

const chartWidth = 800;
const chartHeight = 280;
const padding = { top: 24, right: 18, bottom: 38, left: 54 };

function metricValue(bucket: MoneyTrendBucket, metric: CashFlowMetric): number {
    return metric === 'income'
        ? bucket.incomeMinor + bucket.openingBalanceMinor
        : bucket.spendingMinor;
}

function linePath(points: Array<{ x: number; y: number }>): string {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function MoneyCashFlowChart({ statistics }: { statistics: MoneyStatisticsData }) {
    const [metric, setMetric] = useState<CashFlowMetric>('income');
    const [compare, setCompare] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const gradientId = useId().replace(/:/g, '');
    const buckets = statistics.trend.current;
    const previous = statistics.trend.previous;
    const comparisonEnabled = compare && previous !== null;
    const values = buckets.map((bucket) => metricValue(bucket, metric));
    const previousValues = comparisonEnabled ? previous.map((bucket) => metricValue(bucket, metric)) : [];
    const maximumValue = Math.max(1, ...values, ...previousValues);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const x = (index: number) => padding.left + (buckets.length === 1 ? plotWidth / 2 : index / Math.max(1, buckets.length - 1) * plotWidth);
    const y = (value: number) => padding.top + plotHeight - value / maximumValue * plotHeight;
    const points = buckets.map((bucket, index) => ({ bucket, value: values[index] ?? 0, x: x(index), y: y(values[index] ?? 0) }));
    const currentPath = linePath(points);
    const areaPath = points.length === 0 ? '' : `${currentPath} L ${points.at(-1)?.x} ${padding.top + plotHeight} L ${points[0]?.x} ${padding.top + plotHeight} Z`;
    const previousPoints = comparisonEnabled
        ? points.flatMap((point, index) => previous[index] ? [{ x: point.x, y: y(previousValues[index] ?? 0) }] : [])
        : [];
    const labelStep = Math.max(1, Math.ceil(buckets.length / 6));
    const yTicks = [1, 0.75, 0.5, 0.25, 0];
    const metricLabel = metric === 'income' ? 'Income' : 'Spending';

    return (
        <Surface className="overflow-hidden p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-lg font-bold">{metricLabel} trend</h3>
                    <p className="mt-1 text-sm text-muted">{metricLabel} per {statistics.trend.unit}{metric === 'income' ? ', including opening balances' : ''}.</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {statistics.filter !== 'all' && previous !== null && (
                        <button aria-pressed={compare} className={`focus-ring rounded-full border px-3 py-2 text-xs font-bold ${compare ? 'border-transparent bg-elevated text-foreground' : 'border-border-subtle text-muted hover:text-foreground'}`} onClick={() => setCompare(!compare)} type="button">Compare previous</button>
                    )}
                    <div aria-label="Chart metric" className="flex gap-1 rounded-full border border-border-subtle bg-app p-1" role="group">
                        {(['income', 'spending'] as const).map((value) => (
                            <button aria-pressed={metric === value} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${metric === value ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:text-foreground'}`} key={value} onClick={() => { setMetric(value); setActiveIndex(null); }} type="button">{value === 'income' ? 'Income' : 'Spending'}</button>
                        ))}
                    </div>
                </div>
            </div>
            {buckets.length === 0 ? (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 text-sm text-muted">Financial activity will appear here.</div>
            ) : (
                <div className="relative overflow-x-auto pb-1">
                    <svg aria-label={`Line chart of ${metricLabel.toLowerCase()} per ${statistics.trend.unit}`} className="h-auto min-w-[620px] w-full" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--module-accent)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--module-accent)" stopOpacity="0" /></linearGradient></defs>
                        {yTicks.map((ratio) => {
                            const tickValue = maximumValue * ratio;
                            return <g key={ratio}><line stroke="var(--border-subtle)" strokeDasharray={ratio === 0 ? undefined : '4 8'} x1={padding.left} x2={chartWidth - padding.right} y1={y(tickValue)} y2={y(tickValue)} /><text fill="var(--text-muted)" fontSize="10" textAnchor="end" x={padding.left - 8} y={y(tickValue) + 4}>{formatMinorUnits(Math.round(tickValue), statistics.currency ?? '', false)}</text></g>;
                        })}
                        <path d={areaPath} fill={`url(#${gradientId})`} />
                        {previousPoints.length > 0 && <path d={linePath(previousPoints)} fill="none" stroke="var(--text-muted)" strokeDasharray="5 6" strokeOpacity="0.55" strokeWidth="2" />}
                        <path d={currentPath} fill="none" stroke="var(--module-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                        {points.map((point, index) => {
                            const active = activeIndex === index;
                            const tooltipX = Math.min(chartWidth - 88, Math.max(88, point.x));
                            const tooltipY = Math.max(2, point.y - (metric === 'income' ? 72 : 56));
                            const accessibleLabel = metric === 'income'
                                ? `${point.bucket.label}: income ${formatMinorUnits(point.value, statistics.currency ?? '')}, recorded ${formatMinorUnits(point.bucket.incomeMinor, statistics.currency ?? '')}, opening balance ${formatMinorUnits(point.bucket.openingBalanceMinor, statistics.currency ?? '')}`
                                : `${point.bucket.label}: spending ${formatMinorUnits(point.value, statistics.currency ?? '')}`;

                            return (
                                <g aria-label={accessibleLabel} key={point.bucket.date} onBlur={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} role="button" tabIndex={0}>
                                    <circle className="cursor-pointer" cx={point.x} cy={point.y} fill="transparent" r="14" />
                                    <circle cx={point.x} cy={point.y} fill={active ? 'var(--module-accent)' : 'var(--surface-primary)'} r={active ? 6 : 4} stroke="var(--module-accent)" strokeWidth="3" />
                                    {active && <g aria-hidden="true"><rect fill="var(--surface-elevated)" height={metric === 'income' ? 60 : 44} rx="10" stroke="var(--border-strong)" width="166" x={tooltipX - 83} y={tooltipY} /><text fill="var(--text-secondary)" fontSize="10" textAnchor="middle" x={tooltipX} y={tooltipY + 15}>{point.bucket.label}</text><text fill="var(--text-primary)" fontSize="13" fontWeight="700" textAnchor="middle" x={tooltipX} y={tooltipY + 33}>{formatMinorUnits(point.value, statistics.currency ?? '')} {metricLabel.toLowerCase()}</text>{metric === 'income' && <text fill="var(--text-muted)" fontSize="9" textAnchor="middle" x={tooltipX} y={tooltipY + 49}>Recorded {formatMinorUnits(point.bucket.incomeMinor, statistics.currency ?? '')} · Opening {formatMinorUnits(point.bucket.openingBalanceMinor, statistics.currency ?? '')}</text>}</g>}
                                </g>
                            );
                        })}
                        {points.map((point, index) => index === 0 || index === points.length - 1 || index % labelStep === 0 ? <text fill="var(--text-muted)" fontSize="10" key={point.bucket.date} textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'} x={point.x} y={chartHeight - 10}>{point.bucket.label}</text> : null)}
                    </svg>
                </div>
            )}
            <p className="mt-2 text-xs leading-5 text-muted">Follow the line to see your {metric === 'income' ? 'income peaks' : 'highest-spending periods'}. Hover or focus a point for the exact amount.</p>
        </Surface>
    );
}
