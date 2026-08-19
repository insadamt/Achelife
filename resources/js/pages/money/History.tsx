import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

import { Button, Field, SelectField, Surface } from '../../components/ui';
import { ActivityList } from '../../features/money/ActivityList';
import { MoneyDrawer } from '../../features/money/MoneyDrawer';
import { MoneySectionNav } from '../../features/money/MoneySectionNav';
import { TransactionDrawer } from '../../features/money/TransactionDrawer';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData, MoneyTransactionType } from '../../features/money/types';

interface PaginatedTransactions {
    data: MoneyTransactionData[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    from: number | null;
    to: number | null;
    total: number;
}

interface RawAccount { id: number; name: string; currency: string; archived_at: string | null }
interface HistoryFilters { type?: MoneyTransactionType; account?: string | number; category?: string | number; from?: string; to?: string; search?: string }
interface EditableHistoryFilters { type: string; account: string; category: string; from: string; to: string; search: string }
interface HistoryProps { today: string; transactions: PaginatedTransactions; accounts: RawAccount[]; categories: MoneyCategoryData[]; filters: HistoryFilters }

function FilterFields({
    accounts,
    categories,
    filters,
    onChange,
    today,
}: {
    accounts: RawAccount[];
    categories: MoneyCategoryData[];
    filters: EditableHistoryFilters;
    onChange: (filters: EditableHistoryFilters) => void;
    today: string;
}) {
    return (
        <>
            <SelectField label="Type" onChange={(event) => onChange({ ...filters, type: event.target.value })} options={[{ label: 'All types', value: '' }, { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' }, { label: 'Transfer', value: 'transfer' }]} value={filters.type} />
            <SelectField label="Account" onChange={(event) => onChange({ ...filters, account: event.target.value })} options={[{ label: 'All Accounts', value: '' }, ...accounts.map((account) => ({ label: `${account.name}${account.archived_at ? ' · Archived' : ''}`, value: String(account.id) }))]} value={filters.account} />
            <SelectField label="Category" onChange={(event) => onChange({ ...filters, category: event.target.value })} options={[{ label: 'All Categories', value: '' }, ...categories.map((category) => ({ label: `${category.name}${category.archivedAt ? ' · Archived' : ''}`, value: String(category.id) }))]} value={filters.category} />
            <Field label="From" max={today} onChange={(event) => onChange({ ...filters, from: event.target.value })} type="date" value={filters.from} />
            <Field label="To" max={today} onChange={(event) => onChange({ ...filters, to: event.target.value })} type="date" value={filters.to} />
        </>
    );
}

function appliedFilterLabels(props: HistoryProps): string[] {
    const labels: string[] = [];
    const account = props.accounts.find((item) => item.id === Number(props.filters.account));
    const category = props.categories.find((item) => item.id === Number(props.filters.category));

    if (props.filters.type) labels.push(props.filters.type);
    if (account) labels.push(account.name);
    if (category) labels.push(category.name);
    if (props.filters.from) labels.push(`From ${props.filters.from}`);
    if (props.filters.to) labels.push(`To ${props.filters.to}`);

    return labels;
}

export default function MoneyHistory(props: HistoryProps) {
    const [filters, setFilters] = useState<EditableHistoryFilters>({
        type: props.filters.type ?? '',
        account: String(props.filters.account ?? ''),
        category: String(props.filters.category ?? ''),
        from: props.filters.from ?? '',
        to: props.filters.to ?? '',
        search: props.filters.search ?? '',
    });
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selected, setSelected] = useState<MoneyTransactionData | null>(null);
    const activeFilterLabels = appliedFilterLabels(props);
    const drawerAccounts: MoneyAccountData[] = props.accounts.map((account, index) => ({
        id: account.id,
        name: account.name,
        currency: account.currency,
        archivedAt: account.archived_at,
        initialBalanceMinor: 0,
        balanceMinor: 0,
        themeIndex: index % 6,
        visualIdentifier: '0000',
        hasHistory: true,
        canDelete: false,
    }));

    function applyFilters(event?: FormEvent) {
        event?.preventDefault();
        router.get('/money/history', {
            type: filters.type,
            account: filters.account,
            category: filters.category,
            from: filters.from,
            to: filters.to,
            search: filters.search,
        }, { preserveState: true, replace: true, onSuccess: () => setFiltersOpen(false) });
    }

    function clearFilters() {
        const clearedFilters = { type: '', account: '', category: '', from: '', to: '', search: '' };
        setFilters(clearedFilters);
        router.get('/money/history', {}, { preserveState: true, replace: true, onSuccess: () => setFiltersOpen(false) });
    }

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money history" />
            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Transaction history</h1>
                </div>
                <MoneySectionNav active="history" />
            </header>

            <Surface className="mb-5 p-4 sm:p-5" elevated>
                <form className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(16rem,2fr)_repeat(3,minmax(8rem,1fr))_auto] lg:items-end" onSubmit={applyFilters}>
                    <div className="relative">
                        <Search aria-hidden="true" className="pointer-events-none absolute top-[2.8rem] left-4 text-muted" size={18} />
                        <Field className="pl-11" label="Search" onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Notes or categories" value={filters.search} />
                    </div>
                    <div className="hidden lg:contents">
                        <SelectField label="Type" onChange={(event) => setFilters({ ...filters, type: event.target.value })} options={[{ label: 'All types', value: '' }, { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' }, { label: 'Transfer', value: 'transfer' }]} value={filters.type} />
                        <SelectField label="Account" onChange={(event) => setFilters({ ...filters, account: event.target.value })} options={[{ label: 'All Accounts', value: '' }, ...props.accounts.map((account) => ({ label: account.name, value: String(account.id) }))]} value={filters.account} />
                        <SelectField label="Category" onChange={(event) => setFilters({ ...filters, category: event.target.value })} options={[{ label: 'All Categories', value: '' }, ...props.categories.map((category) => ({ label: category.name, value: String(category.id) }))]} value={filters.category} />
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1 lg:flex-none" type="submit"><Search aria-hidden="true" size={16} />Search</Button>
                        <Button className="lg:hidden" onClick={() => setFiltersOpen(true)} variant="secondary">
                            <SlidersHorizontal aria-hidden="true" size={17} /> Filters{activeFilterLabels.length > 0 ? ` (${activeFilterLabels.length})` : ''}
                        </Button>
                    </div>
                </form>
                <div className="mt-4 hidden grid-cols-2 gap-4 border-t border-border-subtle pt-4 lg:grid xl:grid-cols-[1fr_1fr_auto]">
                    <Field label="From" max={props.today} onChange={(event) => setFilters({ ...filters, from: event.target.value })} type="date" value={filters.from} />
                    <Field label="To" max={props.today} onChange={(event) => setFilters({ ...filters, to: event.target.value })} type="date" value={filters.to} />
                    <div className="flex items-end"><Button onClick={clearFilters} variant="ghost"><X aria-hidden="true" size={15} />Clear all</Button></div>
                </div>
            </Surface>

            {(activeFilterLabels.length > 0 || props.filters.search) && (
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    {props.filters.search && <span className="rounded-full border border-border-strong bg-elevated px-3 py-1.5 text-xs font-semibold">“{props.filters.search}”</span>}
                    {activeFilterLabels.map((label) => <span className="rounded-full border border-border-strong bg-elevated px-3 py-1.5 text-xs font-semibold capitalize" key={label}>{label}</span>)}
                    <button className="focus-ring inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-xs font-bold text-muted hover:text-foreground" onClick={clearFilters} type="button"><X aria-hidden="true" size={14} /> Clear</button>
                </div>
            )}

            <div className="mb-4 flex items-end justify-between gap-4">
                <h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Activity</h2>
                <span className="text-right text-xs font-semibold text-muted">
                    {props.transactions.total === 0 ? '0 records' : `${props.transactions.from}–${props.transactions.to} of ${props.transactions.total}`}
                </span>
            </div>
            <Surface className="p-2 sm:p-3" elevated>
                <ActivityList emptyMessage="No transactions match these filters." onSelect={setSelected} transactions={props.transactions.data} />
            </Surface>

            {props.transactions.last_page > 1 && (
                <div className="mt-5 flex items-center justify-between">
                    <Button disabled={!props.transactions.prev_page_url} onClick={() => props.transactions.prev_page_url && router.visit(props.transactions.prev_page_url)} size="small" variant="secondary"><ChevronLeft aria-hidden="true" size={15} />Previous</Button>
                    <span className="text-sm text-muted">Page {props.transactions.current_page} of {props.transactions.last_page}</span>
                    <Button disabled={!props.transactions.next_page_url} onClick={() => props.transactions.next_page_url && router.visit(props.transactions.next_page_url)} size="small" variant="secondary">Next<ChevronRight aria-hidden="true" size={15} /></Button>
                </div>
            )}

            <MoneyDrawer onClose={() => setFiltersOpen(false)} open={filtersOpen} title="Filter history">
                <form className="space-y-5" onSubmit={applyFilters}>
                    <FilterFields accounts={props.accounts} categories={props.categories} filters={filters} onChange={setFilters} today={props.today} />
                    <div className="flex gap-2 pt-2">
                        <Button className="flex-1" type="submit"><SlidersHorizontal aria-hidden="true" size={16} />Apply filters</Button>
                        <Button onClick={clearFilters} variant="ghost"><X aria-hidden="true" size={15} />Clear</Button>
                    </div>
                </form>
            </MoneyDrawer>
            {selected && <TransactionDrawer accounts={drawerAccounts} categories={props.categories} onClose={() => setSelected(null)} today={props.today} transaction={selected} />}
        </div>
    );
}
