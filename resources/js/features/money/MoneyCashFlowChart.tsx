import { useState } from 'react';

import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';
import type { MoneyStatisticsData, MoneyTrendBucket } from './statisticsTypes';

const chartWidth = 900;
const chartHeight = 310;
const padding = { top: 28, right: 18, bottom: 42, left: 54 };

function moneyIn(bucket: MoneyTrendBucket): number {
    return bucket.incomeMinor + bucket.openingBalanceMinor;
}

export function MoneyCashFlowChart({ statistics }: { statistics: MoneyStatisticsData }) {
    const [compare, setCompare] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const buckets = statistics.trend.current;
    const previous = statistics.trend.previous;
    const comparisonEnabled = compare && previous !== null;
    const values = buckets.flatMap((bucket) => [moneyIn(bucket), bucket.spendingMinor]);
    if (comparisonEnabled) values.push(...previous.flatMap((bucket) => [moneyIn(bucket), bucket.spendingMinor]));
    const maximumValue = Math.max(0, ...values);
    const minimumValue = Math.min(0, ...values);
    const valueRange = Math.max(1, maximumValue - minimumValue);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const zeroY = padding.top + maximumValue / valueRange * plotHeight;
    const groupWidth = plotWidth / Math.max(1, buckets.length);
    const barWidth = Math.max(3, Math.min(16, groupWidth * 0.3));
    const labelStep = Math.max(1, Math.ceil(buckets.length / 7));
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maximumValue - valueRange * ratio);
    const bar = (value: number) => ({
        height: Math.abs(value) / valueRange * plotHeight,
        y: value >= 0 ? zeroY - value / valueRange * plotHeight : zeroY,
    });

    return (
        <Surface className="overflow-hidden p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold">Income and spending</h3><p className="mt-1 text-sm text-muted">Opening balances join income on their Account creation date.</p></div>
                {statistics.filter !== 'all' && previous !== null && <button aria-pressed={compare} className={`focus-ring rounded-full border px-3 py-2 text-xs font-bold ${compare ? 'border-transparent bg-[var(--module-accent)] text-accent-foreground' : 'border-border-subtle text-muted hover:text-foreground'}`} onClick={() => setCompare(!compare)} type="button">Compare previous</button>}
            </div>
            {buckets.length === 0 ? (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 text-sm text-muted">Financial activity will appear here.</div>
            ) : (
                <div className="relative overflow-x-auto">
                    <svg aria-label={`Income and spending per ${statistics.trend.unit}`} className="h-auto min-w-[720px] w-full" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        {yTicks.map((tick, index) => {
                            const y = padding.top + plotHeight * index / (yTicks.length - 1);
                            return <g key={index}><line stroke="var(--border-subtle)" strokeDasharray={Math.abs(tick) < 0.01 ? undefined : '4 8'} x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} /><text fill="var(--text-muted)" fontSize="10" textAnchor="end" x={padding.left - 8} y={y + 4}>{formatMinorUnits(Math.round(tick), statistics.currency ?? '', false)}</text></g>;
                        })}
                        {buckets.map((bucket, index) => {
                            const center = padding.left + groupWidth * index + groupWidth / 2;
                            const income = moneyIn(bucket);
                            const spending = bucket.spendingMinor;
                            const incomeBar = bar(income);
                            const spendingBar = bar(spending);
                            const openingBar = bar(bucket.openingBalanceMinor);
                            const previousBucket = comparisonEnabled ? previous[index] : null;
                            const active = activeIndex === index;
                            const tooltipX = Math.min(chartWidth - 100, Math.max(100, center));
                            return (
                                <g aria-label={`${bucket.label}: income ${formatMinorUnits(income, statistics.currency ?? '')}, spending ${formatMinorUnits(spending, statistics.currency ?? '')}, net ${formatMinorUnits(bucket.netMinor, statistics.currency ?? '')}`} key={bucket.date} onBlur={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} role="button" tabIndex={0}>
                                    {previousBucket && <><rect fill="color-mix(in srgb, var(--module-accent) 18%, transparent)" {...bar(moneyIn(previousBucket))} rx="2" width={barWidth} x={center - barWidth - 3} /><rect fill="color-mix(in srgb, var(--text-muted) 22%, transparent)" {...bar(previousBucket.spendingMinor)} rx="2" width={barWidth} x={center + 3} /></>}
                                    <rect fill="var(--module-accent)" height={incomeBar.height} opacity={active ? 1 : 0.82} rx="2" width={barWidth} x={center - barWidth - 3} y={incomeBar.y} />
                                    {bucket.openingBalanceMinor !== 0 && <rect fill="var(--accent-ink)" height={openingBar.height} opacity="0.72" rx="2" width={barWidth} x={center - barWidth - 3} y={openingBar.y} />}
                                    <rect fill="var(--text-secondary)" height={spendingBar.height} opacity={active ? 0.9 : 0.62} rx="2" width={barWidth} x={center + 3} y={spendingBar.y} />
                                    <rect fill="transparent" height={plotHeight} width={groupWidth} x={center - groupWidth / 2} y={padding.top} />
                                    {active && <g aria-hidden="true"><rect fill="var(--surface-elevated)" height={72} rx="11" stroke="var(--border-strong)" width={190} x={tooltipX - 95} y={4} /><text fill="var(--text-secondary)" fontSize="10" textAnchor="middle" x={tooltipX} y={20}>{bucket.label}</text><text fill="var(--text-primary)" fontSize="11" fontWeight="700" textAnchor="middle" x={tooltipX} y={38}>In {formatMinorUnits(income, statistics.currency ?? '')} · Out {formatMinorUnits(spending, statistics.currency ?? '')}</text><text fill={bucket.netMinor >= 0 ? 'var(--success)' : 'var(--danger)'} fontSize="11" fontWeight="700" textAnchor="middle" x={tooltipX} y={57}>Net {formatMinorUnits(bucket.netMinor, statistics.currency ?? '')}</text></g>}
                                </g>
                            );
                        })}
                        {buckets.map((bucket, index) => index === 0 || index === buckets.length - 1 || index % labelStep === 0 ? <text fill="var(--text-muted)" fontSize="10" key={bucket.date} textAnchor={index === 0 ? 'start' : index === buckets.length - 1 ? 'end' : 'middle'} x={padding.left + groupWidth * index + groupWidth / 2} y={chartHeight - 12}>{bucket.label}</text> : null)}
                    </svg>
                </div>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-muted"><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-[var(--module-accent)]" />Income</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-accent-ink/70" />Opening balance</span><span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-secondary/65" />Spending</span></div>
        </Surface>
    );
}
