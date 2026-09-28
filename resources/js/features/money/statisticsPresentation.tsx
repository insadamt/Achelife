import { StatisticDelta } from '../../components/ui/StatisticDelta';
import { formatMinorUnits } from './moneyPresentation';

const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function MoneyDelta({ current, previous, currency, favorable = 'up', rate = false }: {
    current: number | null;
    previous: number | null;
    currency: string;
    favorable?: 'up' | 'down' | 'neutral';
    rate?: boolean;
}) {
    return <StatisticDelta current={current} formatValue={(value) => rate ? formatRate(value) : formatMinorUnits(value, currency)} favorable={favorable} previous={previous} />;
}

export function CountDelta({ current, previous, favorable = 'neutral' }: { current: number; previous: number | null; favorable?: 'up' | 'down' | 'neutral' }) {
    return <StatisticDelta current={current} formatValue={(value) => decimal.format(value)} favorable={favorable} previous={previous} />;
}

export function formatRate(value: number | null): string {
    return value === null ? '—' : `${decimal.format(value)}%`;
}

export function formatShare(amountMinor: number, totalMinor: number): string {
    return totalMinor === 0 ? '0%' : `${decimal.format(amountMinor / totalMinor * 100)}%`;
}
