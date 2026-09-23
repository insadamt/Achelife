import { Link } from '@inertiajs/react';
import { ChartNoAxesCombined, ChevronDown, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Surface } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import { formatMinorUnits } from './moneyPresentation';
import { MoneyDelta } from './statisticsPresentation';
import type { MoneyStatisticsBreakdownItem, MoneyStatisticsData } from './statisticsTypes';

const center = 110;
const radius = 72;
type DistributionType = 'income' | 'expense';

interface Slice {
    amountMinor: number;
    color: string;
    items: MoneyStatisticsBreakdownItem[];
    key: string;
    name: string;
    share: number;
}

export function MoneyBreakdownDonut({ statistics }: { statistics: MoneyStatisticsData }) {
    const [type, setType] = useState<DistributionType>('expense');
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const items = type === 'income' ? statistics.current.incomeBreakdown : statistics.current.spendingBreakdown;
    const total = type === 'income' ? statistics.current.totalIncomeMinor : statistics.current.spendingMinor;
    const slices = useMemo(() => donutSlices(items, total), [items, total]);
    const active = slices.find((slice) => slice.key === activeKey) ?? null;
    const selected = slices.find((slice) => slice.key === selectedKey) ?? null;

    function changeType(nextType: DistributionType) {
        setType(nextType);
        setActiveKey(null);
        setSelectedKey(null);
    }

    return <>
        <Surface className="min-w-0 rounded-3xl p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="flex items-center gap-2 text-lg font-bold"><ChartNoAxesCombined aria-hidden="true" className="text-accent-ink" size={18} />Distribution</h3><p className="mt-1 text-sm text-muted">Choose a segment for its full breakdown and transactions.</p></div><div aria-label="Distribution type" className="flex rounded-xl border border-border-subtle bg-app p-1" role="group">{(['expense', 'income'] as const).map((option) => <button aria-pressed={type === option} className={`focus-ring rounded-lg px-3 py-1.5 text-xs font-bold ${type === option ? 'bg-[var(--money-accent)] text-accent-foreground' : 'text-muted hover:text-foreground'}`} key={option} onClick={() => changeType(option)} type="button">{option === 'expense' ? 'Spending' : 'Income'}</button>)}</div></div>
            {slices.length === 0 ? <p className="mt-5 grid min-h-52 place-items-center rounded-2xl border border-dashed border-border-strong bg-app/35 px-5 text-center text-sm text-muted">No {type} activity in this period.</p> : <div className="mt-5"><div aria-label={`${type === 'expense' ? 'Spending by Category' : 'Income sources'}: ${slices.map((slice) => `${slice.name} ${percentage(slice.share)}`).join(', ')}`} className="relative mx-auto size-72 sm:size-80"><svg className="size-full overflow-visible" viewBox="0 0 220 220"><circle cx={center} cy={center} fill="none" r={radius} stroke="var(--border-subtle)" strokeWidth="24" />{arcs(slices).map((arc) => <path aria-label={`Open ${arc.slice.name}: ${formatMinorUnits(arc.slice.amountMinor, statistics.currency ?? '')}, ${percentage(arc.slice.share)}`} className="cursor-pointer outline-none transition-[stroke-width,opacity,filter] duration-200 focus-visible:[filter:drop-shadow(0_0_6px_currentColor)]" d={arcPath(arc.start, arc.end)} fill="none" key={arc.slice.key} onBlur={() => setActiveKey(null)} onClick={() => setSelectedKey(arc.slice.key)} onFocus={() => setActiveKey(arc.slice.key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedKey(arc.slice.key); } }} onPointerDown={(event) => event.currentTarget.focus()} onPointerEnter={() => setActiveKey(arc.slice.key)} onPointerLeave={() => setActiveKey(null)} opacity={activeKey !== null && activeKey !== arc.slice.key ? 0.28 : 1} pointerEvents="stroke" role="button" stroke={arc.slice.color} strokeWidth={activeKey === arc.slice.key ? 30 : 24} style={{ filter: activeKey === arc.slice.key ? `drop-shadow(0 0 7px ${arc.slice.color})` : undefined }} tabIndex={0} />)}</svg><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div className="grid w-[58%] justify-items-center overflow-hidden">{active ? <><span className="line-clamp-2 text-lg font-bold leading-tight sm:text-xl">{active.name}</span><span className="mt-2 text-sm font-bold tabular-nums" style={{ color: active.color }}>{formatMinorUnits(active.amountMinor, statistics.currency ?? '')} · {percentage(active.share)}</span></> : <><span className="max-w-full truncate text-[clamp(1rem,5vw,1.5rem)] font-bold tabular-nums">{formatMinorUnits(total, statistics.currency ?? '')}</span><span className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-muted">{type === 'expense' ? 'Spending' : 'Income'}</span></>}</div></div></div>
                <ul aria-label={`${type === 'expense' ? 'Spending' : 'Income'} distribution legend`} className="mt-6 grid gap-x-8 gap-y-2 border-t border-border-subtle pt-5 sm:grid-cols-2 xl:grid-cols-3">{slices.map((slice) => <li key={slice.key}><button className="focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left hover:bg-surface-hover" onClick={() => setSelectedKey(slice.key)} type="button"><span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} /><span className="truncate text-sm font-semibold">{slice.name}</span></span><span className="shrink-0 text-right text-xs font-bold tabular-nums">{formatMinorUnits(slice.amountMinor, statistics.currency ?? '')}<span className="ml-2 text-muted">{percentage(slice.share)}</span></span></button></li>)}</ul>
            </div>}
        </Surface>
        {selected && <BreakdownDrawer onClose={() => setSelectedKey(null)} selected={selected} statistics={statistics} total={total} type={type} />}
    </>;
}

function BreakdownDrawer({ selected, statistics, total, type, onClose }: { selected: Slice; statistics: MoneyStatisticsData; total: number; type: DistributionType; onClose: () => void }) {
    const previousItems = type === 'income' ? statistics.previous?.incomeBreakdown : statistics.previous?.spendingBreakdown;
    const previousTotal = type === 'income' ? statistics.previous?.totalIncomeMinor : statistics.previous?.spendingMinor;
    const previousByKey = new Map((previousItems ?? []).map((item) => [item.key, item]));
    const previous = selected.key === 'other' ? null : previousByKey.get(selected.key);
    const previousShare = previous && previousTotal ? previous.amountMinor / previousTotal * 100 : 0;
    const shareDelta = Math.round((selected.share - previousShare) * 10) / 10;
    const history = selected.key === 'other' ? null : historyUrl(statistics, selected.items[0]!, type);
    const title = selected.key === 'other' ? 'Other categories' : selected.name;

    return <MoneyDrawer description={selected.key === 'other' ? 'Categories outside the eight largest chart segments.' : `${type === 'expense' ? 'Spending' : 'Income'} detail for ${statistics.label}.`} onClose={onClose} open title={title}>
        <div className="rounded-2xl border border-border-subtle bg-app p-5" style={{ borderLeftColor: selected.color, borderLeftWidth: 4 }}><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{type === 'expense' ? 'Spending' : 'Income'} share</p><p className="mt-2 text-3xl font-bold tabular-nums" style={{ color: selected.color }}>{formatMinorUnits(selected.amountMinor, statistics.currency ?? '')}</p><p className="mt-2 text-sm font-semibold text-secondary">{percentage(selected.share)} of {type === 'expense' ? 'spending' : 'income'}</p>{statistics.filter !== 'all' && <div className="mt-4 flex flex-wrap gap-3"><MoneyDelta current={selected.amountMinor} currency={statistics.currency ?? ''} favorable={type === 'income' ? 'up' : 'down'} previous={previous?.amountMinor ?? 0} /><span className={shareDelta === 0 ? 'text-xs font-bold text-muted' : shareDelta > 0 ? type === 'expense' ? 'text-xs font-bold text-danger' : 'text-xs font-bold text-success' : type === 'expense' ? 'text-xs font-bold text-success' : 'text-xs font-bold text-danger'}>{shareDelta > 0 ? '+' : ''}{shareDelta} pp share</span></div>}</div>
        {history && <Link className="focus-ring mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--money-accent)] px-4 text-sm font-bold text-accent-foreground hover:brightness-95" href={history}><ExternalLink aria-hidden="true" size={16} />View transactions</Link>}
        <div className="mt-5 space-y-3">{selected.items.map((item) => <BreakdownItem item={item} key={item.key} previous={previousByKey.get(item.key)} statistics={statistics} total={total} type={type} />)}</div>
    </MoneyDrawer>;
}

function BreakdownItem({ item, previous, statistics, total, type }: { item: MoneyStatisticsBreakdownItem; previous?: MoneyStatisticsBreakdownItem; statistics: MoneyStatisticsData; total: number; type: DistributionType }) {
    const share = total === 0 ? 0 : item.amountMinor / total * 100;
    const history = historyUrl(statistics, item, type);

    return <article className="rounded-2xl border border-border-subtle bg-surface p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="flex items-center gap-2"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><h3 className="truncate font-bold">{item.name}</h3></span><p className="mt-1 text-sm text-muted">{percentage(share)} of {type === 'expense' ? 'spending' : 'income'}</p></div><strong className="shrink-0 tabular-nums">{formatMinorUnits(item.amountMinor, statistics.currency ?? '')}</strong></div>{statistics.filter !== 'all' && <div className="mt-3"><MoneyDelta current={item.amountMinor} currency={statistics.currency ?? ''} favorable={type === 'income' ? 'up' : 'down'} previous={previous?.amountMinor ?? 0} /></div>}{history && <Link className="focus-ring mt-3 inline-flex items-center gap-1 rounded text-sm font-bold text-accent-ink hover:underline" href={history}>View transactions <ExternalLink aria-hidden="true" size={14} /></Link>}{item.subcategories.length > 0 && <details className="group mt-4 border-t border-border-subtle pt-3"><summary className="focus-ring flex cursor-pointer list-none items-center gap-1 rounded-lg text-sm font-bold text-secondary hover:text-foreground"><ChevronDown className="transition-transform group-open:rotate-180" size={16} />Subcategories</summary><div className="mt-3 space-y-2">{item.subcategories.map((subcategory) => { const previousSubcategory = previous?.subcategories.find((candidate) => candidate.key === subcategory.key); const subcategoryHistory = historyUrl(statistics, item, type, subcategory.subcategoryId); return <div className="flex items-center justify-between gap-3" key={subcategory.key}><div className="min-w-0"><p className="truncate text-sm font-semibold">{subcategory.name}</p>{statistics.filter !== 'all' && <MoneyDelta current={subcategory.amountMinor} currency={statistics.currency ?? ''} favorable={type === 'income' ? 'up' : 'down'} previous={previousSubcategory?.amountMinor ?? 0} />}</div>{subcategoryHistory ? <Link className="focus-ring shrink-0 text-sm font-bold tabular-nums hover:text-accent-ink" href={subcategoryHistory}>{formatMinorUnits(subcategory.amountMinor, statistics.currency ?? '')}</Link> : <strong className="shrink-0 text-sm tabular-nums">{formatMinorUnits(subcategory.amountMinor, statistics.currency ?? '')}</strong>}</div>; })}</div></details>}</article>;
}

function historyUrl(statistics: MoneyStatisticsData, item: MoneyStatisticsBreakdownItem, type: DistributionType, subcategoryId?: number | null): string | null {
    if (item.key === 'opening-balances') return null;
    const params = new URLSearchParams();
    if (item.key === 'transfer-fees') params.set('search', 'Bank Fees'); else { if (!item.includesProjectedFees) params.set('type', type); if (item.categoryId !== null) params.set('category', String(item.categoryId)); if (subcategoryId !== null && subcategoryId !== undefined) params.set('subcategory', String(subcategoryId)); }
    if (statistics.currency) params.set('currency', statistics.currency);
    if (statistics.accountId !== null) params.set('account', String(statistics.accountId));
    if (statistics.range.start) params.set('from', statistics.range.start);
    params.set('to', statistics.range.end);
    return `/money/history?${params.toString()}`;
}

function donutSlices(items: MoneyStatisticsBreakdownItem[], total: number): Slice[] {
    if (total <= 0) return [];
    const ranked = items.filter((item) => item.amountMinor > 0);
    const top = ranked.slice(0, 8);
    const rest = ranked.slice(8);
    return [...top.map((item) => slice(item, total)), ...(rest.length > 0 ? [{ amountMinor: rest.reduce((sum, item) => sum + item.amountMinor, 0), color: '#94A3B8', items: rest, key: 'other', name: 'Other', share: rest.reduce((sum, item) => sum + item.amountMinor, 0) / total * 100 }] : [])];
}

function slice(item: MoneyStatisticsBreakdownItem, total: number): Slice { return { amountMinor: item.amountMinor, color: item.color, items: [item], key: item.key, name: item.name, share: item.amountMinor / total * 100 }; }
function arcs(slices: Slice[]): Array<{ slice: Slice; start: number; end: number }> { let cursor = 0; return slices.map((slice, index) => { const end = index === slices.length - 1 ? 360 : cursor + slice.share * 3.6; const arc = { slice, start: cursor, end }; cursor = end; return arc; }); }
function arcPath(start: number, end: number): string { const span = Math.max(0, end - start); if (span >= 359.99) return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`; const point = (angle: number) => { const radians = (angle - 90) * Math.PI / 180; return { x: center + radius * Math.cos(radians), y: center + radius * Math.sin(radians) }; }; const first = point(start); const second = point(Math.min(360, end + 0.35)); if (span <= 180) return `M ${first.x} ${first.y} A ${radius} ${radius} 0 0 1 ${second.x} ${second.y}`; const middle = point(start + span / 2); return `M ${first.x} ${first.y} A ${radius} ${radius} 0 0 1 ${middle.x} ${middle.y} A ${radius} ${radius} 0 0 1 ${second.x} ${second.y}`; }
function percentage(value: number): string { return `${value.toFixed(value < 10 ? 1 : 0)}%`; }
