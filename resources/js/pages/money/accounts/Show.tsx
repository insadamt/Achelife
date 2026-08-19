import { Head, Link, router } from '@inertiajs/react';
import { Archive, ArrowLeft, Pencil, ReceiptText, RotateCcw, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../../components/ui';
import { AccountCard } from '../../../features/money/AccountCard';
import { AccountFormDrawer } from '../../../features/money/AccountFormDrawer';
import { ActivityList } from '../../../features/money/ActivityList';
import { MoneyConfirmationDialog } from '../../../features/money/MoneyConfirmationDialog';
import { MoneyDrawer } from '../../../features/money/MoneyDrawer';
import { MoneyQuickActions } from '../../../features/money/MoneyQuickActions';
import { TransactionDrawer } from '../../../features/money/TransactionDrawer';
import { formatMinorUnits } from '../../../features/money/moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData, MoneyTransactionType } from '../../../features/money/types';

interface AccountShowProps {
    today: string;
    account: MoneyAccountData;
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    transactions: MoneyTransactionData[];
}

type ConfirmationAction = 'archive' | 'delete' | null;

export default function AccountShow(props: AccountShowProps) {
    const [editingAccount, setEditingAccount] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [creatingType, setCreatingType] = useState<MoneyTransactionType | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<MoneyTransactionData | null>(null);
    const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>(null);
    const archived = props.account.archivedAt !== null;

    function editAccount() {
        setSettingsOpen(false);
        setEditingAccount(true);
    }

    function archiveAccount() {
        router.post(`/money/accounts/${props.account.id}/archive`);
    }

    function deleteAccount() {
        router.delete(`/money/accounts/${props.account.id}`);
    }

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title={`${props.account.name} · Money`} />
            <Link className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full text-sm font-bold text-muted hover:text-foreground" href={archived ? '/money/accounts/archived' : '/money'}>
                <ArrowLeft aria-hidden="true" size={17} /> Back to {archived ? 'Archived Accounts' : 'Money'}
            </Link>

            <header className="mt-5 mb-7 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">{props.account.currency} Account</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{props.account.name}</h1>
                </div>
                <Button onClick={() => setSettingsOpen(true)} size="small" variant="secondary">
                    <Settings2 aria-hidden="true" size={16} /> Settings
                </Button>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,32rem)_1fr] xl:items-stretch">
                <AccountCard account={props.account} large />
                <Surface className="flex flex-col justify-between p-5 sm:p-6" elevated>
                    <div>
                        <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Account details</p>
                        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div><dt className="text-muted">Currency</dt><dd className="mt-1 font-bold">{props.account.currency}</dd></div>
                            <div><dt className="text-muted">Wallet ID</dt><dd className="mt-1 font-bold tabular-nums">•••• {props.account.visualIdentifier}</dd></div>
                            <div className="col-span-2"><dt className="text-muted">Opening balance</dt><dd className="mt-1 font-bold tabular-nums">{formatMinorUnits(props.account.initialBalanceMinor, props.account.currency)}</dd></div>
                        </dl>
                    </div>
                    {archived ? (
                        <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/8 p-4">
                            <p className="font-bold text-warning">Archived Account</p>
                            <p className="mt-1 text-sm text-secondary">History remains intact. Reactivate this Account before recording new activity.</p>
                            <Button className="mt-4" onClick={() => router.post(`/money/accounts/${props.account.id}/reactivate`, {}, { preserveScroll: true })}><RotateCcw aria-hidden="true" size={16} />Reactivate</Button>
                        </div>
                    ) : (
                        <div className="mt-6">
                            <MoneyQuickActions onSelect={setCreatingType} />
                        </div>
                    )}
                </Surface>
            </div>

            <section className="mt-10">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Recent activity</h2>
                    <Link className="icon-text flex items-center gap-1.5 text-sm font-bold text-[var(--money-accent)] hover:underline" href={`/money/history?account=${props.account.id}`}><ReceiptText aria-hidden="true" size={15} />Full history</Link>
                </div>
                <Surface className="p-2 sm:p-3" elevated>
                    <ActivityList
                        contextAccountId={props.account.id}
                        emptyMessage="No activity involves this Account yet."
                        onSelect={setSelectedTransaction}
                        transactions={props.transactions}
                    />
                </Surface>
            </section>

            <MoneyDrawer onClose={() => setSettingsOpen(false)} open={settingsOpen} title="Account settings">
                <div className="space-y-3">
                    <Button fullWidth onClick={editAccount} variant="secondary"><Pencil aria-hidden="true" size={16} />Edit Account</Button>
                    {!archived && <Button fullWidth onClick={() => setConfirmationAction('archive')} variant="ghost"><Archive aria-hidden="true" size={16} />Archive Account</Button>}
                    {props.account.canDelete && <Button fullWidth onClick={() => setConfirmationAction('delete')} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete permanently</Button>}
                </div>
                {props.account.hasHistory && <p className="mt-5 rounded-2xl border border-border-subtle bg-app px-4 py-3 text-sm text-muted">Currency and opening balance are locked because this Account has financial history.</p>}
            </MoneyDrawer>

            <MoneyConfirmationDialog
                confirmLabel="Archive Account"
                description={`${props.account.name} will no longer be available for new transactions. Its balance and complete history will remain available.`}
                onClose={() => setConfirmationAction(null)}
                onConfirm={archiveAccount}
                open={confirmationAction === 'archive'}
                title={`Archive ${props.account.name}?`}
            />
            <MoneyConfirmationDialog
                confirmLabel="Delete Account"
                destructive
                description="This unused Account will be permanently removed."
                onClose={() => setConfirmationAction(null)}
                onConfirm={deleteAccount}
                open={confirmationAction === 'delete'}
                title={`Delete ${props.account.name}?`}
            />

            {editingAccount && <AccountFormDrawer account={props.account} onClose={() => setEditingAccount(false)} />}
            {creatingType && <TransactionDrawer accounts={props.accounts} categories={props.categories} initialAccountId={props.account.id} initialType={creatingType} onClose={() => setCreatingType(null)} today={props.today} />}
            {selectedTransaction && <TransactionDrawer accounts={props.accounts} categories={props.categories} initialAccountId={props.account.id} onClose={() => setSelectedTransaction(null)} today={props.today} transaction={selectedTransaction} />}
        </div>
    );
}
