import { PiggyBank } from 'lucide-react';

import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';
import { formatRate, MoneyDelta } from './statisticsPresentation';
import type { MoneyStatisticsData } from './statisticsTypes';

export function MoneyStatisticCards({ statistics }: { statistics: MoneyStatisticsData }) {
    const { current, previous } = statistics;
    const currency = statistics.currency ?? '';
    const cards = [
        {
            label: 'Total income',
            detail: `${formatMinorUnits(current.recordedIncomeMinor, currency)} recorded · ${formatMinorUnits(current.openingBalanceMinor, currency)} opening`,
            value: formatMinorUnits(current.totalIncomeMinor, currency),
            current: current.totalIncomeMinor,
            previous: previous?.totalIncomeMinor ?? null,
            favorable: 'up' as const,
        },
        {
            label: 'Total spending',
            detail: 'Expenses and Transfer fees',
            value: formatMinorUnits(current.spendingMinor, currency),
            current: current.spendingMinor,
            previous: previous?.spendingMinor ?? null,
            favorable: 'down' as const,
        },
        {
            label: 'Net cash flow',
            detail: 'Total income minus spending',
            value: formatMinorUnits(current.netCashFlowMinor, currency),
            current: current.netCashFlowMinor,
            previous: previous?.netCashFlowMinor ?? null,
            favorable: 'up' as const,
        },
        {
            label: 'Savings rate',
            detail: 'Net cash flow as a share of income',
            value: formatRate(current.savingsRate),
            current: current.savingsRate,
            previous: previous?.savingsRate ?? null,
            favorable: 'up' as const,
            rate: true,
        },
    ];
    const savingsCard = cards[3]!;

    return (
        <Surface className="overflow-hidden" elevated>
            <div className="grid divide-y divide-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                {cards.slice(0, 3).map(({ label, detail, value, current: cardCurrent, previous: cardPrevious, favorable }) => (
                    <div className="min-w-0 p-4 sm:p-5" key={label}>
                        <h3 className="text-xs font-semibold text-muted">{label}</h3>
                        <p className="mt-2 break-words text-2xl font-bold leading-none tracking-[-0.04em] tabular-nums sm:text-3xl">{value}</p>
                        <p className="mt-2 truncate text-xs text-muted">{detail}</p>
                        {statistics.filter !== 'all' && <div className="mt-3 text-xs font-semibold"><MoneyDelta current={cardCurrent} currency={currency} favorable={favorable} previous={cardPrevious} /></div>}
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3 sm:px-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-secondary"><PiggyBank aria-hidden="true" className="text-accent-ink" size={16} />Savings rate</p>
                <div className="flex items-center gap-3"><strong className="text-lg tabular-nums">{savingsCard.value}</strong>{statistics.filter !== 'all' && <MoneyDelta current={savingsCard.current} currency={currency} favorable="up" previous={savingsCard.previous} rate />}</div>
            </div>
        </Surface>
    );
}
