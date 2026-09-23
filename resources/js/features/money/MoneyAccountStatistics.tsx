import { ArrowDownToLine, ArrowUpFromLine, Landmark, Repeat2, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';

import { Surface } from '../../components/ui';
import { formatMoneyDate, formatMinorUnits } from './moneyPresentation';
import { CountDelta, MoneyDelta } from './statisticsPresentation';
import type { MoneyAccountActivity, MoneyStatisticsData } from './statisticsTypes';

export function MoneyAccountStatistics({ statistics }: { statistics: MoneyStatisticsData }) {
    const currency = statistics.currency ?? '';

    return <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="p-4 sm:p-5"><SectionHeading description="Every card reconciles the selected period’s opening and closing balance." title="Account balance movement" />
            {statistics.current.accounts.length === 0 ? <p className="rounded-2xl border border-dashed border-border-strong p-6 text-center text-sm text-muted">No Accounts in this currency.</p> : <div className="space-y-3">{statistics.current.accounts.map((account) => <AccountBalanceCard account={account} currency={currency} key={account.id} />)}</div>}
        </Surface>
        <Surface className="p-4 sm:p-5"><SectionHeading description="Useful signals from the selected period" title="Highlights" /><div className="grid gap-3 sm:grid-cols-2">
            <Highlight label="Average daily spending" value={formatMinorUnits(statistics.current.averageDailySpendingMinor, currency)} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.averageDailySpendingMinor} currency={currency} favorable="down" previous={statistics.previous?.averageDailySpendingMinor ?? 0} />} />
            <Highlight label="No-spend days" value={`${statistics.current.noSpendDays} of ${statistics.current.elapsedDays}`} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.noSpendRate} currency={currency} favorable="up" previous={statistics.previous?.noSpendRate ?? null} rate />} />
            <Highlight label="Subscription spending" value={formatMinorUnits(statistics.current.subscriptionSpendingMinor, currency)} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.subscriptionSpendingMinor} currency={currency} favorable="down" previous={statistics.previous?.subscriptionSpendingMinor ?? 0} />} />
            <Highlight label="Transfer fees" value={formatMinorUnits(statistics.current.transferFeesMinor, currency)} delta={statistics.filter === 'all' ? null : <MoneyDelta current={statistics.current.transferFeesMinor} currency={currency} favorable="down" previous={statistics.previous?.transferFeesMinor ?? 0} />} />
            <Highlight label="Transactions" value={String(statistics.current.transactionCount)} delta={statistics.filter === 'all' ? null : <CountDelta current={statistics.current.transactionCount} previous={statistics.previous?.transactionCount ?? 0} />} />
            <Highlight label="Highest-spending day" value={statistics.current.highestSpendingDay ? `${formatMinorUnits(statistics.current.highestSpendingDay.amountMinor, currency)} · ${formatMoneyDate(statistics.current.highestSpendingDay.date)}` : '—'} delta={statistics.filter === 'all' || !statistics.current.highestSpendingDay ? null : <MoneyDelta current={statistics.current.highestSpendingDay.amountMinor} currency={currency} favorable="down" previous={statistics.previous?.highestSpendingDay?.amountMinor ?? 0} />} />
        </div></Surface>
    </div>;
}

function AccountBalanceCard({ account, currency }: { account: MoneyAccountActivity; currency: string }) {
    const movements = [['Initial balance added', account.openingBalanceMinor, Landmark], ['Income', account.incomeMinor, ArrowDownToLine], ['Spending', -account.spendingMinor, ArrowUpFromLine], ['Transfers', account.transferredInMinor - account.transferredOutMinor, Repeat2], ['Debt cash movement', account.debtInMinor - account.debtOutMinor, Repeat2]] as const;
    return <article className="rounded-2xl border border-border-subtle bg-app/30 p-4"><div className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><WalletCards className="shrink-0 text-accent-ink" size={17} /><h4 className="truncate font-bold">{account.name}</h4>{account.archived && <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold text-muted">Archived</span>}</span><strong className="shrink-0 text-right text-lg tabular-nums">{formatMinorUnits(account.closingBalanceMinor, currency)}</strong></div>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2.5 text-sm"><div><p className="text-xs font-semibold text-muted">Opening</p><strong className="tabular-nums">{formatMinorUnits(account.periodOpeningBalanceMinor, currency)}</strong></div><span className={account.netMovementMinor >= 0 ? 'text-success' : 'text-danger'}>{account.netMovementMinor >= 0 ? '+' : '−'} {formatMinorUnits(Math.abs(account.netMovementMinor), currency)}</span><div className="text-right"><p className="text-xs font-semibold text-muted">Closing</p><strong className="tabular-nums">{formatMinorUnits(account.closingBalanceMinor, currency)}</strong></div></div>
        <details className="group mt-3 border-t border-border-subtle pt-2"><summary className="focus-ring cursor-pointer rounded-lg text-xs font-bold text-muted hover:text-foreground">Show reconciliation</summary><div className="mt-3 space-y-2">{movements.map(([label, amount, Icon]) => <div className="flex items-center justify-between gap-3 text-sm" key={label}><span className="flex items-center gap-2 text-secondary"><Icon size={14} />{label}</span><strong className={amount < 0 ? 'text-danger tabular-nums' : amount > 0 ? 'text-success tabular-nums' : 'tabular-nums'}>{amount > 0 ? '+' : amount < 0 ? '−' : ''}{formatMinorUnits(Math.abs(amount), currency)}</strong></div>)}</div></details>
    </article>;
}

function SectionHeading({ title, description }: { title: string; description: string }) { return <div className="mb-4"><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>; }
function Highlight({ label, value, delta }: { label: string; value: string; delta: ReactNode }) {
    return <div className="rounded-2xl border border-border-subtle bg-app/30 p-3"><p className="text-xs font-semibold text-muted">{label}</p><p className="mt-2 text-lg font-bold tabular-nums">{value}</p>{delta && <div className="mt-2">{delta}</div>}</div>;
}
