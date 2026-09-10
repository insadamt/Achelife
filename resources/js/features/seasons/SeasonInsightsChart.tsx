import { useId, useState } from 'react';

import type { SeasonTimelinePoint } from './insightsTypes';

export type SeasonChartView = 'cumulative' | 'daily';

const chartWidth = 800;
const chartHeight = 280;
const padding = { top: 24, right: 18, bottom: 38, left: 48 };

export function SeasonInsightsChart({ current, previous, view }: { current: SeasonTimelinePoint[]; previous: SeasonTimelinePoint[] | null; view: SeasonChartView }) {
    const gradientId = useId().replace(/:/g, '');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const pointValue = (point: SeasonTimelinePoint) => view === 'cumulative' ? point.cumulativeSp : point.dailySp;
    const values = [...current, ...(previous ?? [])].map(pointValue);
    const minimum = Math.min(0, ...values);
    const maximum = Math.max(1, ...values);
    const range = Math.max(1, maximum - minimum);
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;
    const x = (day: number) => padding.left + (day - 1) / 29 * plotWidth;
    const y = (value: number) => padding.top + (maximum - value) / range * plotHeight;
    const path = (points: SeasonTimelinePoint[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.day)} ${y(pointValue(point))}`).join(' ');
    const currentPath = path(current);
    const firstPoint = current[0];
    const currentLast = current.at(-1);
    const zeroY = y(0);
    const areaPath = firstPoint && currentLast ? `${currentPath} L ${x(currentLast.day)} ${zeroY} L ${x(firstPoint.day)} ${zeroY} Z` : '';
    const labelStep = Math.max(1, Math.ceil(current.length / 6));
    const yTicks = [1, 0.75, 0.5, 0.25, 0];
    const activePoint = activeIndex === null ? null : current[activeIndex];
    const activePointX = activePoint ? x(activePoint.day) : 0;
    const activePointY = activePoint ? y(pointValue(activePoint)) : 0;
    const tooltipX = Math.min(chartWidth - 74, Math.max(74, activePointX));
    const tooltipY = Math.max(2, activePointY - 64);

    return (
        <div>
            <div className="relative overflow-x-auto pb-1">
                <svg aria-label={`Line chart of ${view === 'cumulative' ? 'cumulative Season Points' : 'daily Season Points'} by Season day`} className="h-auto min-w-[620px] w-full" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <defs>
                        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--module-accent)" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="var(--module-accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {yTicks.map((ratio) => {
                        const value = minimum + range * ratio;
                        const tickY = y(value);

                        return <g key={ratio}><line stroke="var(--border-subtle)" strokeDasharray={ratio === 0 ? undefined : '4 8'} x1={padding.left} x2={chartWidth - padding.right} y1={tickY} y2={tickY} /><text fill="var(--text-muted)" fontSize="11" textAnchor="end" x={padding.left - 10} y={tickY + 4}>{Math.round(value)}</text></g>;
                    })}
                    {minimum < 0 && maximum > 0 && <line stroke="var(--border-strong)" x1={padding.left} x2={chartWidth - padding.right} y1={zeroY} y2={zeroY} />}
                    {previous && <path d={path(previous)} fill="none" stroke="var(--text-muted)" strokeDasharray="5 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />}
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path d={currentPath} fill="none" stroke="var(--module-accent)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                    {current.map((point, index) => {
                        const pointX = x(point.day);
                        const pointY = y(pointValue(point));
                        const active = activeIndex === index;

                        return (
                            <g aria-label={`${point.label}, Day ${point.day}: ${point.cumulativeSp} cumulative SP, ${point.dailySp} SP that day`} key={point.date} onBlur={() => setActiveIndex(null)} onFocus={() => setActiveIndex(index)} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)} role="button" tabIndex={0}>
                                <circle className="cursor-pointer" cx={pointX} cy={pointY} fill="transparent" r="14" />
                                <circle cx={pointX} cy={pointY} fill={active ? 'var(--module-accent)' : 'var(--surface-primary)'} r={active ? 6 : 4} stroke="var(--module-accent)" strokeWidth="3" />
                            </g>
                        );
                    })}
                    {current.map((point, index) => {
                        const show = index === 0 || index === current.length - 1 || index % labelStep === 0;

                        return show ? <text fill="var(--text-muted)" fontSize="10" key={point.date} textAnchor={index === 0 ? 'start' : index === current.length - 1 ? 'end' : 'middle'} x={x(point.day)} y={chartHeight - 10}>Day {point.day}</text> : null;
                    })}
                    <g aria-hidden="true" data-chart-tooltip-layer="true" pointerEvents="none">
                        {activePoint && (
                            <>
                                <rect fill="var(--surface-elevated)" height="52" rx="10" stroke="var(--border-strong)" width="132" x={tooltipX - 66} y={tooltipY} />
                                <text fill="var(--text-secondary)" fontSize="10" textAnchor="middle" x={tooltipX} y={tooltipY + 15}>{activePoint.label} · Day {activePoint.day}</text>
                                <text fill="var(--text-primary)" fontSize="14" fontWeight="700" textAnchor="middle" x={tooltipX} y={tooltipY + 34}>{view === 'cumulative' ? `${activePoint.cumulativeSp} SP total` : `${activePoint.dailySp > 0 ? '+' : ''}${activePoint.dailySp} SP that day`}</text>
                                <text fill="var(--text-muted)" fontSize="9" textAnchor="middle" x={tooltipX} y={tooltipY + 46}>{view === 'cumulative' ? `${activePoint.dailySp > 0 ? '+' : ''}${activePoint.dailySp} SP that day` : `${activePoint.cumulativeSp} SP total`}</text>
                            </>
                        )}
                    </g>
                </svg>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">{view === 'cumulative' ? 'Follow the line to see how your Season Points build over time.' : 'Follow the line to see the net SP earned or lost on each day.'} Hover or focus a point for its daily change and cumulative total.</p>
        </div>
    );
}
