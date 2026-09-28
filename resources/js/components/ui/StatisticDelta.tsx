import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

type StatisticDeltaProps = {
    current: number | null;
    previous: number | null;
    formatValue: (value: number) => string;
    favorable?: 'up' | 'down' | 'neutral';
    comparisonLabel?: string;
};

const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

function formatRelativeChange(change: number): string {
    const magnitude = Math.abs(change);
    const formattedMagnitude = magnitude > 0 && magnitude < 0.1 ? '<0.1' : decimal.format(magnitude);

    return `${change > 0 ? '+' : change < 0 ? '−' : ''}${formattedMagnitude}%`;
}

export function StatisticDelta({ current, previous, formatValue, favorable = 'up', comparisonLabel = 'previous period' }: StatisticDeltaProps) {
    if (current === null || previous === null) {
        return <span className="text-xs font-medium text-muted">No comparison available</span>;
    }

    const difference = Math.round((current - previous) * 1000) / 1000;
    const Icon = difference > 0 ? ArrowUpRight : difference < 0 ? ArrowDownRight : Minus;
    const improved = favorable === 'up' ? difference > 0 : difference < 0;
    const tone = difference === 0 || favorable === 'neutral'
        ? 'bg-elevated text-secondary'
        : improved ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger';
    const signedChange = `${difference > 0 ? '+' : difference < 0 ? '−' : ''}${formatValue(Math.abs(difference))}`;
    const percentageChange = previous === 0 ? difference === 0 ? '0%' : '—' : formatRelativeChange(difference / Math.abs(previous) * 100);
    const label = `${signedChange} | ${percentageChange}`;

    return (
        <span aria-label={`${label} versus ${comparisonLabel}`} className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full px-2 py-1 text-xs font-bold tabular-nums ${tone}`}>
            <Icon aria-hidden="true" className="shrink-0" size={13} />
            <span className="break-words">{label}</span>
        </span>
    );
}
