import { ArrowDownToLine, ArrowUpFromLine, Repeat2, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';

import { Surface } from '../../components/ui';
import { formatMoneyDate, formatMinorUnits } from './moneyPresentation';
import { CountDelta, MoneyDelta } from './statisticsPresentation';
import type { MoneyAccountActivity, MoneyStatisticsData } from './statisticsTypes';

export function MoneyAccountStatistics({ statistics }: { statistics: MoneyStatisticsData }) {
    const previousAccounts = new Map((statistics.previous?.accounts ?? []).map((account) => [account.id, account]));
    const currency = statistics.currency ?? '';

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <Surface className="p-4 sm:p-5">
                <SectionHeading description="Transfers stay visible without becoming income or spending." title="Account activity" />
                {statistics.current.accounts.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border-strong p-6 text-center text-sm text-muted">No Accounts in this currency.</p>
                ) : (
                    <div className="space-y-3">
                        {statistics.current.accounts.map((account) => (
                            <AccountActivityCard
                                account={account}
                                currency={currency}
                                key={account.id}
                                previous={previousAccounts.get(account.id)}
                                showDelta={statistics.filter !== 'all'}
                            />
                        ))}
                    </div>
                )}
            </Surface>

            <Surface className="p-4 sm:p-5">
                <SectionHeading description="Useful signals from the selected period" title="Highlights" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Highlight label="Average daily spending" value={formatMinorUnits(statistics.current.averageDailySpendingMinor, currency)} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.averageDailySpendingMinor} currency={currency} favorable="down" previous={statistics.previous?.averageDailySpendingMinor ?? 0} />} />
                    <Highlight label="No-spend days" value={`${statistics.current.noSpendDays} of ${statistics.current.elapsedDays}`} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.noSpendRate} currency={currency} favorable="up" previous={statistics.previous?.noSpendRate ?? null} rate />} />
                    <Highlight label="Subscription spending" value={formatMinorUnits(statistics.current.subscriptionSpendingMinor, currency)} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.subscriptionSpendingMinor} currency={currency} favorable="down" previous={statistics.previous?.subscriptionSpendingMinor ?? 0} />} />
                    <Highlight label="Transfer fees" value={formatMinorUnits(statistics.current.transferFeesMinor, currency)} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.transferFeesMinor} currency={currency} favorable="down" previous={statistics.previous?.transferFeesMinor ?? 0} />} />
                    <Highlight label="Transactions" value={String(statistics.current.transactionCount)} delta={statistics.filter === 'all' ? null : <CountDelta current={statistics.current.transactionCount} previous={statistics.previous?.transactionCount ?? 0} />} />
                    <Highlight label="Highest-spending day" value={statistics.current.highestSpendingDay ? `${formatMinorUnits(statistics.current.highestSpendingDay.amountMinor, currency)} · ${formatMoneyDate(statistics.current.highestSpendingDay.date)}` : '—'} delta={statistics.filter === 'all' || !statistics.current.highestSpendingDay ? null : <MoneyDelta current={statistics.current.highestSpendingDay.amountMinor} currency={currency} favorable="down" previous={statistics.previous?.highestSpendingDay?.amountMinor ?? 0} />} />
                </div>
            </Surface>
        </div>
    );
}

function AccountActivityCard({
    account,
    previous,
    currency,
    showDelta,
}: {
    account: MoneyAccountActivity;
    previous?: MoneyAccountActivity;
    currency: string;
    showDelta: boolean;
}) {
    const rows = [
        ['Money in', account.moneyInMinor, previous?.moneyInMinor ?? 0, ArrowDownToLine, 'up' as const],
        ['Spending', account.spendingMinor, previous?.spendingMinor ?? 0, ArrowUpFromLine, 'down' as const],
        ['Net movement', account.netMovementMinor, previous?.netMovementMinor ?? 0, Repeat2, 'up' as const],
    ] as const;

    return (
        <article className="rounded-2xl border border-border-subtle bg-app/30 p-4">
            <div className="flex items-center gap-2">
                <WalletCards className="text-accent-ink" size={17} />
                <h4 className="font-bold">{account.name}</h4>
                {account.archived && <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold text-muted">Archived</span>}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {rows.map(([label, value, previousValue, Icon, favorable]) => (
                    <div key={label}>
                        <p className="flex items-center gap-1 text-xs font-semibold text-muted"><Icon size={13} />{label}</p>
                        <p className="mt-1 font-bold tabular-nums">{formatMinorUnits(value, currency)}</p>
                        {showDelta && <div className="mt-1"><MoneyDelta current={value} currency={currency} favorable={favorable} previous={previousValue} /></div>}
                    </div>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-subtle pt-3 text-xs text-muted">
                <span>Transferred in {formatMinorUnits(account.transferredInMinor, currency)}</span>
                <span>Transferred out {formatMinorUnits(account.transferredOutMinor, currency)}</span>
                <span>Debt money in {formatMinorUnits(account.debtInMinor, currency)}</span>
                <span>Debt money out {formatMinorUnits(account.debtOutMinor, currency)}</span>
            </div>
        </article>
    );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
    return <div className="mb-4"><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>;
}

function Highlight({ label, value, delta }: { label: string; value: string; delta: ReactNode }) {
    return (
        <div className="rounded-2xl border border-border-subtle bg-app/30 p-3">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-2 text-lg font-bold tabular-nums">{value}</p>
            {delta && <div className="mt-2">{delta}</div>}
        </div>
    );
}
