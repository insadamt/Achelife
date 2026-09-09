import { Landmark, PiggyBank, ReceiptText, TrendingUp } from 'lucide-react';

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
            icon: Landmark,
        },
        {
            label: 'Total spending',
            detail: 'Expenses and Transfer fees',
            value: formatMinorUnits(current.spendingMinor, currency),
            current: current.spendingMinor,
            previous: previous?.spendingMinor ?? null,
            favorable: 'down' as const,
            icon: ReceiptText,
        },
        {
            label: 'Net cash flow',
            detail: 'Total income minus spending',
            value: formatMinorUnits(current.netCashFlowMinor, currency),
            current: current.netCashFlowMinor,
            previous: previous?.netCashFlowMinor ?? null,
            favorable: 'up' as const,
            icon: TrendingUp,
        },
        {
            label: 'Savings rate',
            detail: 'Net cash flow as a share of income',
            value: formatRate(current.savingsRate),
            current: current.savingsRate,
            previous: previous?.savingsRate ?? null,
            favorable: 'up' as const,
            rate: true,
            icon: PiggyBank,
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cards.map(({ label, detail, value, current: cardCurrent, previous: cardPrevious, favorable, rate = false, icon: Icon }, index) => (
                <Surface className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl p-4 sm:p-5 ${index === 0 ? 'col-span-2 border-[color-mix(in_srgb,var(--module-accent)_30%,var(--border-subtle))] sm:col-span-1' : ''}`} key={label}>
                    {index === 0 && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-[var(--module-accent)]" />}
                    <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-semibold text-secondary">{label}</h3><Icon aria-hidden="true" className={index === 0 ? 'shrink-0 text-accent-ink' : 'shrink-0 text-muted'} size={16} /></div>
                    <p className="mt-5 break-words text-3xl font-bold leading-none tracking-[-0.05em] tabular-nums sm:text-4xl">{value}</p>
                    <p className="mb-4 mt-2 text-xs leading-5 text-muted">{detail}</p>
                    {statistics.filter !== 'all' && <div className="mt-auto border-t border-border-subtle pt-3 text-xs font-semibold"><MoneyDelta current={cardCurrent} currency={currency} favorable={favorable} previous={cardPrevious} rate={rate} /></div>}
                </Surface>
            ))}
        </div>
    );
}
