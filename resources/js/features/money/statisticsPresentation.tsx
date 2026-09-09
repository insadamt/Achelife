import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { formatMinorUnits } from './moneyPresentation';

const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function MoneyDelta({
    current,
    previous,
    currency,
    favorable = 'up',
    rate = false,
}: {
    current: number | null;
    previous: number | null;
    currency: string;
    favorable?: 'up' | 'down' | 'neutral';
    rate?: boolean;
}) {
    if (current === null || previous === null) return <span className="text-xs font-semibold text-muted">No previous result</span>;

    const delta = Math.round((current - previous) * 10) / 10;
    const relative = previous === 0 ? null : Math.round(delta / Math.abs(previous) * 1000) / 10;
    const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
    const improved = favorable === 'neutral' || (favorable === 'up' ? delta > 0 : delta < 0);
    const worsened = favorable !== 'neutral' && delta !== 0 && !improved;
    const tone = delta === 0 ? 'text-muted' : worsened ? 'text-danger' : favorable === 'neutral' ? 'text-secondary' : 'text-success';
    const label = rate
        ? `${delta > 0 ? '+' : ''}${decimal.format(delta)} pp`
        : previous === 0
            ? delta === 0 ? 'No change' : 'Previously 0'
            : `${delta > 0 ? '+' : ''}${formatMinorUnits(delta, currency)} · ${relative !== null && relative > 0 ? '+' : ''}${decimal.format(relative ?? 0)}%`;

    return <span className={`icon-text inline-flex items-center gap-1 text-xs font-bold ${tone}`}><Icon aria-hidden="true" size={14} />{label}</span>;
}

export function CountDelta({ current, previous, favorable = 'up' }: { current: number; previous: number; favorable?: 'up' | 'down' }) {
    const delta = current - previous;
    const relative = previous === 0 ? null : Math.round(delta / Math.abs(previous) * 1000) / 10;
    const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
    const improved = favorable === 'up' ? delta > 0 : delta < 0;
    const tone = delta === 0 ? 'text-muted' : improved ? 'text-success' : 'text-danger';
    const label = previous === 0
        ? delta === 0 ? 'No change' : 'Previously 0'
        : `${delta > 0 ? '+' : ''}${delta} · ${relative !== null && relative > 0 ? '+' : ''}${decimal.format(relative ?? 0)}%`;

    return <span className={`icon-text inline-flex items-center gap-1 text-xs font-bold ${tone}`}><Icon aria-hidden="true" size={14} />{label}</span>;
}

export function formatRate(value: number | null): string {
    return value === null ? '—' : `${decimal.format(value)}%`;
}

export function formatShare(amountMinor: number, totalMinor: number): string {
    return totalMinor === 0 ? '0%' : `${decimal.format(amountMinor / totalMinor * 100)}%`;
}
