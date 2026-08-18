import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

import { Button, Field, SelectField, Surface } from '../../components/ui';
import { ActivityItem } from '../../features/money/ActivityItem';
import { TransactionDrawer } from '../../features/money/TransactionDrawer';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData, MoneyTransactionType } from '../../features/money/types';

interface PaginatedTransactions { data: MoneyTransactionData[]; current_page: number; last_page: number; prev_page_url: string | null; next_page_url: string | null; total: number; }
interface RawAccount { id: number; name: string; currency: string; archived_at: string | null; }
interface HistoryFilters { type?: MoneyTransactionType; account?: string | number; category?: string | number; from?: string; to?: string; search?: string; }
interface HistoryProps { today: string; transactions: PaginatedTransactions; accounts: RawAccount[]; categories: MoneyCategoryData[]; filters: HistoryFilters; }

export default function MoneyHistory(props: HistoryProps) {
    const [filters, setFilters] = useState({ type: props.filters.type ?? '', account: String(props.filters.account ?? ''), category: String(props.filters.category ?? ''), from: props.filters.from ?? '', to: props.filters.to ?? '', search: props.filters.search ?? '' });
    const [selected, setSelected] = useState<MoneyTransactionData | null>(null);
    const drawerAccounts: MoneyAccountData[] = props.accounts.map((account, index) => ({ id: account.id, name: account.name, currency: account.currency, archivedAt: account.archived_at, initialBalanceMinor: 0, balanceMinor: 0, themeIndex: index % 6, visualIdentifier: '0000', hasHistory: true, canDelete: false }));

    function submit(event: FormEvent) {
        event.preventDefault();
        router.get('/money/history', filters, { preserveState: true, replace: true });
    }

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money history" />
            <Link className="text-sm font-bold text-muted hover:text-foreground" href="/money">← Back to Money</Link>
            <header className="mt-6 mb-7"><p className="text-xs font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">Operational record</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Transaction history</h1><p className="mt-2 text-sm text-secondary">Search and filter the underlying records. This is history, not financial analytics.</p></header>

            <Surface className="mb-7 p-4 sm:p-5" elevated><form className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" onSubmit={submit}>
                <Field className="xl:col-span-2" label="Search notes/categories" onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Groceries" value={filters.search} />
                <SelectField label="Type" onChange={(event) => setFilters({ ...filters, type: event.target.value })} options={[{ label: 'All types', value: '' }, { label: 'Income', value: 'income' }, { label: 'Expense', value: 'expense' }, { label: 'Transfer', value: 'transfer' }]} value={filters.type} />
                <SelectField label="Account" onChange={(event) => setFilters({ ...filters, account: event.target.value })} options={[{ label: 'All Accounts', value: '' }, ...props.accounts.map((account) => ({ label: `${account.name}${account.archived_at ? ' · Archived' : ''}`, value: String(account.id) }))]} value={filters.account} />
                <SelectField label="Category" onChange={(event) => setFilters({ ...filters, category: event.target.value })} options={[{ label: 'All Categories', value: '' }, ...props.categories.map((category) => ({ label: `${category.name}${category.archivedAt ? ' · Archived' : ''}`, value: String(category.id) }))]} value={filters.category} />
                <Field label="From" onChange={(event) => setFilters({ ...filters, from: event.target.value })} type="date" value={filters.from} />
                <Field label="To" max={props.today} onChange={(event) => setFilters({ ...filters, to: event.target.value })} type="date" value={filters.to} />
                <div className="flex items-end"><Button fullWidth type="submit">Apply</Button></div>
            </form></Surface>

            <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">All activity</h2><span className="text-xs font-semibold text-muted">{props.transactions.total} records</span></div>
            <Surface className="p-2 sm:p-3" elevated>{props.transactions.data.length > 0 ? props.transactions.data.map((transaction) => <ActivityItem key={transaction.id} onClick={() => setSelected(transaction)} transaction={transaction} />) : <p className="px-5 py-14 text-center text-secondary">No transactions match these filters.</p>}</Surface>
            {props.transactions.last_page > 1 && <div className="mt-5 flex items-center justify-between"><Button disabled={!props.transactions.prev_page_url} onClick={() => props.transactions.prev_page_url && router.visit(props.transactions.prev_page_url)} size="small" variant="secondary">Previous</Button><span className="text-sm text-muted">Page {props.transactions.current_page} of {props.transactions.last_page}</span><Button disabled={!props.transactions.next_page_url} onClick={() => props.transactions.next_page_url && router.visit(props.transactions.next_page_url)} size="small" variant="secondary">Next</Button></div>}
            {selected && <TransactionDrawer accounts={drawerAccounts} categories={props.categories} onClose={() => setSelected(null)} today={props.today} transaction={selected} />}
        </div>
    );
}
