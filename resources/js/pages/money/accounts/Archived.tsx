import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, RotateCcw, WalletCards } from 'lucide-react';
import type { CSSProperties } from 'react';

import { Button, StatusChip, Surface } from '../../../components/ui';
import { formatMinorUnits } from '../../../features/money/moneyPresentation';
import type { MoneyAccountData } from '../../../features/money/types';

export default function ArchivedAccounts({ accounts }: { accounts: MoneyAccountData[] }) {
    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Archived Accounts" />
            <Link className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full text-sm font-bold text-muted hover:text-foreground" href="/money">
                <ArrowLeft aria-hidden="true" size={17} /> Back to Money
            </Link>
            <header className="mt-5 mb-8">
                <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Archived Accounts</h1>
            </header>

            {accounts.length > 0 ? (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <Surface className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:p-5" elevated key={account.id}>
                            <Link className="focus-ring flex min-w-0 flex-1 items-center gap-4 rounded-2xl" href={`/money/accounts/${account.id}`}>
                                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border-strong bg-app text-muted">
                                    <WalletCards aria-hidden="true" size={21} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex flex-wrap items-center gap-2">
                                        <span className="truncate text-lg font-bold">{account.name}</span>
                                        <StatusChip>Archived</StatusChip>
                                    </span>
                                    <span className="mt-1 block text-sm text-muted">
                                        {account.currency} · Archived {account.archivedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(account.archivedAt)) : ''}
                                    </span>
                                </span>
                                <ArrowUpRight aria-hidden="true" className="shrink-0 text-muted" size={18} />
                            </Link>
                            <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-4 sm:border-t-0 sm:pt-0">
                                <p className="font-bold tabular-nums">{formatMinorUnits(account.balanceMinor, account.currency)}</p>
                                <Button onClick={() => router.post(`/money/accounts/${account.id}/reactivate`, {}, { preserveScroll: true })} size="small"><RotateCcw aria-hidden="true" size={15} />Reactivate</Button>
                            </div>
                        </Surface>
                    ))}
                </div>
            ) : (
                <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated>
                    <div>
                        <p className="text-2xl font-bold">No Archived Accounts</p>
                        <p className="mt-2 text-secondary">Accounts you archive will remain safely available here.</p>
                    </div>
                </Surface>
            )}
        </div>
    );
}
