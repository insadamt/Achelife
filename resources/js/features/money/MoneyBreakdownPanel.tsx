import { Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

import { Surface } from '../../components/ui';
import { formatMinorUnits } from './moneyPresentation';
import { formatShare, MoneyDelta } from './statisticsPresentation';
import type { MoneyStatisticsBreakdownItem, MoneyStatisticsData } from './statisticsTypes';

function historyUrl(statistics: MoneyStatisticsData, item: MoneyStatisticsBreakdownItem, type: 'income' | 'expense', subcategoryId?: number | null): string | null {
    if (item.key === 'opening-balances') return null;

    const params = new URLSearchParams();
    if (item.key === 'transfer-fees') params.set('search', 'Bank Fees');
    else {
        if (!item.includesProjectedFees) params.set('type', type);
        if (item.categoryId !== null) params.set('category', String(item.categoryId));
        if (subcategoryId !== null && subcategoryId !== undefined) params.set('subcategory', String(subcategoryId));
    }
    if (statistics.currency) params.set('currency', statistics.currency);
    if (statistics.accountId !== null) params.set('account', String(statistics.accountId));
    if (statistics.range.start) params.set('from', statistics.range.start);
    params.set('to', statistics.range.end);

    return `/money/history?${params.toString()}`;
}

export function MoneyBreakdownPanel({ statistics, type }: { statistics: MoneyStatisticsData; type: 'income' | 'expense' }) {
    const currentItems = type === 'income' ? statistics.current.incomeBreakdown : statistics.current.spendingBreakdown;
    const previousItems = type === 'income' ? statistics.previous?.incomeBreakdown : statistics.previous?.spendingBreakdown;
    const total = type === 'income' ? statistics.current.totalIncomeMinor : statistics.current.spendingMinor;
    const previousTotal = type === 'income' ? statistics.previous?.totalIncomeMinor : statistics.previous?.spendingMinor;
    const previousByKey = new Map((previousItems ?? []).map((item) => [item.key, item]));
    const title = type === 'income' ? 'Income sources' : 'Spending by Category';

    return (
        <Surface className="min-w-0 p-4 sm:p-5">
            <div className="mb-4"><h3 className="text-lg font-bold">{title}</h3><p className="mt-1 text-sm text-muted">Amount, share, and period change</p></div>
            {currentItems.length === 0 ? (
                <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-border-strong px-4 text-center text-sm text-muted">No {type} activity in this period.</div>
            ) : (
                <div className="space-y-2">
                    {currentItems.map((item) => {
                        const previous = previousByKey.get(item.key);
                        const share = total === 0 ? 0 : item.amountMinor / total * 100;
                        const previousShare = previousTotal && previous ? previous.amountMinor / previousTotal * 100 : 0;
                        const shareDelta = Math.round((share - previousShare) * 10) / 10;
                        const url = historyUrl(statistics, item, type);
                        const content = <><span className="truncate font-bold">{item.name}</span><span className="shrink-0 text-sm font-bold tabular-nums">{formatMinorUnits(item.amountMinor, statistics.currency ?? '')}</span></>;

                        return (
                            <div className="rounded-2xl border border-border-subtle bg-app/30 p-3" key={item.key}>
                                <div className="flex items-center justify-between gap-3">{url ? <Link className="focus-ring flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg hover:text-accent-ink" href={url}>{content}</Link> : <div className="flex min-w-0 flex-1 items-center justify-between gap-3">{content}</div>}</div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full bg-[var(--module-accent)]" style={{ width: `${Math.max(0, Math.min(100, share))}%` }} /></div>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-semibold text-muted">{formatShare(item.amountMinor, total)} of {type}</span>{statistics.filter !== 'all' && <div className="flex flex-wrap items-center gap-2"><MoneyDelta current={item.amountMinor} currency={statistics.currency ?? ''} favorable={type === 'income' ? 'up' : 'down'} previous={previous?.amountMinor ?? 0} /><span className={shareDelta > 0 ? type === 'expense' ? 'text-danger' : 'text-success' : shareDelta < 0 ? type === 'expense' ? 'text-success' : 'text-danger' : 'text-muted'}>{shareDelta > 0 ? '+' : ''}{shareDelta} pp share</span></div>}</div>
                                {item.subcategories.length > 0 && <details className="group mt-3 border-t border-border-subtle pt-2"><summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-lg text-xs font-bold text-muted hover:text-foreground"><ChevronDown className="transition-transform group-open:rotate-180" size={14} />Subcategories</summary><div className="mt-2 space-y-1">{item.subcategories.map((subcategory) => {
                                    const previousSubcategory = previous?.subcategories.find((candidate) => candidate.key === subcategory.key);
                                    const subcategoryUrl = historyUrl(statistics, item, type, subcategory.subcategoryId);
                                    return <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm" key={subcategory.key}>{subcategoryUrl ? <Link className="focus-ring truncate rounded hover:text-accent-ink" href={subcategoryUrl}>{subcategory.name}</Link> : <span className="truncate">{subcategory.name}</span>}<div className="flex shrink-0 flex-col items-end"><span className="font-semibold tabular-nums">{formatMinorUnits(subcategory.amountMinor, statistics.currency ?? '')}</span>{statistics.filter !== 'all' && <MoneyDelta current={subcategory.amountMinor} currency={statistics.currency ?? ''} favorable={type === 'income' ? 'up' : 'down'} previous={previousSubcategory?.amountMinor ?? 0} />}</div></div>;
                                })}</div></details>}
                            </div>
                        );
                    })}
                </div>
            )}
        </Surface>
    );
}
