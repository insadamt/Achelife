import { AlertTriangle, HandCoins } from 'lucide-react';

import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';
import type { MoneyStatisticsData } from './statisticsTypes';

export function MoneyDebtStatistics({ statistics }: { statistics: MoneyStatisticsData }) {
    const { debt } = statistics.current;
    const currency = statistics.currency ?? '';
    const activity = [
        ['Borrowed', debt.activity.borrowedMinor], ['Lent', debt.activity.lentMinor], ['Repaid', debt.activity.repaidMinor], ['Collected', debt.activity.collectedMinor], ['Forgiven (you owed)', debt.activity.payableForgivenMinor], ['Written off (owed to you)', debt.activity.receivableForgivenMinor],
    ].filter(([, amount]) => amount > 0) as Array<[string, number]>;

    return <Surface className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-lg font-bold"><HandCoins aria-hidden="true" className="text-accent-ink" size={18} />Debt snapshot</h3><p className="mt-1 text-sm text-muted">Outstanding agreements stay separate from cash flow.{debt.positionIsCurrencyWide ? ' Positions cover every Account in this currency.' : ''}</p></div>{debt.position.overdueCount > 0 && <span className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning"><AlertTriangle size={14} />{debt.position.overdueCount} overdue</span>}</div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><Amount label="You owe" value={debt.position.payableMinor} currency={currency} /><Amount label="Owed to you" tone="good" value={debt.position.receivableMinor} currency={currency} /><Amount label="Overdue" tone={debt.position.overdueMinor > 0 ? 'warning' : undefined} value={debt.position.overdueMinor} currency={currency} /></div>
        <div className="mt-5 border-t border-border-subtle pt-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Activity in {statistics.label}</p>{activity.length === 0 ? <p className="mt-3 text-sm text-muted">No debt activity in this period.</p> : <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">{activity.map(([label, amount]) => <div className="flex items-center justify-between gap-3" key={label}><span className="text-sm font-semibold text-secondary">{label}</span><strong className="text-sm tabular-nums">{formatMinorUnits(amount, currency)}</strong></div>)}</div>}</div>
    </Surface>;
}

function Amount({ label, value, currency, tone }: { label: string; value: number; currency: string; tone?: 'good' | 'warning' }) {
    return <div className="rounded-2xl border border-border-subtle bg-app/30 p-3"><p className="text-xs font-semibold text-muted">{label}</p><p className={`mt-2 text-xl font-bold tabular-nums ${tone === 'good' ? 'text-success' : tone === 'warning' ? 'text-warning' : ''}`}>{formatMinorUnits(value, currency)}</p></div>;
}
