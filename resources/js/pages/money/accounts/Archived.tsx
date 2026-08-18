import { Head, Link, router } from '@inertiajs/react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../../components/ui';
import { AccountCard } from '../../../features/money/AccountCard';
import { formatMinorUnits } from '../../../features/money/moneyPresentation';
import type { MoneyAccountData } from '../../../features/money/types';

export default function ArchivedAccounts({ accounts }: { accounts: MoneyAccountData[] }) {
    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Archived Accounts" /><Link className="text-sm font-bold text-muted hover:text-foreground" href="/money">← Back to Money</Link>
            <header className="mt-6 mb-8"><p className="text-xs font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">Wallet archive</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Archived Accounts</h1><p className="mt-2 text-sm text-secondary">Closed or paused Accounts retain their complete history and exact current balance.</p></header>
            {accounts.length > 0 ? <div className="grid gap-6 xl:grid-cols-2">{accounts.map((account) => <Surface className="p-4 sm:p-5" elevated key={account.id}><AccountCard account={account} /><div className="mt-5 flex items-center justify-between gap-4"><div><p className="font-bold">{formatMinorUnits(account.balanceMinor, account.currency)}</p><p className="mt-1 text-xs text-muted">Archived {account.archivedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(account.archivedAt)) : ''}</p></div><Button onClick={() => router.post(`/money/accounts/${account.id}/reactivate`, {}, { preserveScroll: true })}>Reactivate</Button></div></Surface>)}</div> : <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated><div><p className="text-2xl font-bold">No Archived Accounts</p><p className="mt-2 text-secondary">Accounts you archive will remain safely available here.</p></div></Surface>}
        </div>
    );
}
