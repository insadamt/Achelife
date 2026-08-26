import { Link, router, useForm } from '@inertiajs/react';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, SelectField, StatusChip } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
import { formatMinorUnits, formatMoneyDate, minorUnitsInput, transactionTitle } from './moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData, MoneyTransactionType } from './types';

interface TransactionPayload {
    type: MoneyTransactionType;
    amount: string;
    fee: string;
    account_id: number | '';
    destination_account_id: number | '';
    category_id: number | '';
    subcategory_id: number | '';
    date: string;
    note: string;
}

const transactionTypes: Array<{ icon: typeof ArrowDownLeft; label: string; type: MoneyTransactionType }> = [
    { icon: ArrowDownLeft, label: 'Income', type: 'income' },
    { icon: ArrowUpRight, label: 'Expense', type: 'expense' },
    { icon: ArrowRightLeft, label: 'Transfer', type: 'transfer' },
];

function accountOptions(accounts: MoneyAccountData[], transaction: MoneyTransactionData | null) {
    const options = accounts.map((account) => ({ id: account.id, name: account.name, currency: account.currency }));

    for (const account of [transaction?.account, transaction?.destinationAccount]) {
        if (account && !options.some((option) => option.id === account.id)) options.push(account);
    }

    return options;
}

function TransactionTypeControl({ onChange, value }: { onChange: (type: MoneyTransactionType) => void; value: MoneyTransactionType }) {
    return (
        <fieldset>
            <legend className="mb-2 text-sm font-semibold text-secondary">Transaction type</legend>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border-subtle bg-app p-1.5">
                {transactionTypes.map((item) => {
                    const TypeIcon = item.icon;
                    const selected = value === item.type;

                    return (
                        <button
                            aria-pressed={selected}
                            className={classNames(
                                'focus-ring flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-bold uppercase transition-colors',
                                selected
                                    ? 'border-[color-mix(in_srgb,var(--money-accent)_40%,transparent)] bg-elevated text-foreground shadow-sm'
                                    : 'border-transparent text-muted hover:text-foreground',
                                selected && item.type === 'income' && 'text-success',
                                selected && item.type === 'expense' && 'text-danger',
                            )}
                            key={item.type}
                            onClick={() => onChange(item.type)}
                            type="button"
                        >
                            <TypeIcon aria-hidden="true" size={17} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

export function TransactionDrawer({
    accounts,
    categories,
    today,
    transaction = null,
    initialType = null,
    initialAccountId,
    onClose,
}: {
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    today: string;
    transaction?: MoneyTransactionData | null;
    initialType?: MoneyTransactionType | null;
    initialAccountId?: number;
    onClose: () => void;
}) {
    const [editing, setEditing] = useState(transaction === null);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const accountsWithHistory = useMemo(() => accountOptions(accounts, transaction), [accounts, transaction]);
    const form = useForm<TransactionPayload>({
        type: transaction?.type ?? initialType ?? 'expense',
        amount: transaction ? minorUnitsInput(transaction.amountMinor) : '',
        fee: transaction ? minorUnitsInput(transaction.feeMinor) : '0.00',
        account_id: transaction?.account.id ?? initialAccountId ?? accounts[0]?.id ?? '',
        destination_account_id: transaction?.destinationAccount?.id ?? '',
        category_id: transaction?.category?.id ?? '',
        subcategory_id: transaction?.subcategory?.id ?? '',
        date: transaction?.date ?? today,
        note: transaction?.note ?? '',
    });
    const type = form.data.type;
    const selectedAccount = accountsWithHistory.find((account) => account.id === Number(form.data.account_id));
    const matchingDestinations = accountsWithHistory.filter(
        (account) => account.id !== Number(form.data.account_id) && account.currency === selectedAccount?.currency,
    );
    const relevantCategories = categories.filter(
        (category) => category.type === type && (category.archivedAt === null || category.id === Number(form.data.category_id)),
    );
    const selectedCategory = relevantCategories.find((category) => category.id === Number(form.data.category_id));
    const subcategories = selectedCategory?.subcategories.filter(
        (subcategory) => subcategory.archivedAt === null || subcategory.id === Number(form.data.subcategory_id),
    ) ?? [];

    function chooseType(nextType: MoneyTransactionType) {
        form.setData({ ...form.data, type: nextType, destination_account_id: '', category_id: '', subcategory_id: '' });
    }

    function chooseAccount(accountId: number) {
        form.setData({ ...form.data, account_id: accountId, destination_account_id: '' });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            destination_account_id: type === 'transfer' ? data.destination_account_id : null,
            fee: type === 'transfer' ? data.fee : '0.00',
            category_id: type === 'transfer' ? null : data.category_id,
            subcategory_id: type === 'transfer' || data.subcategory_id === '' ? null : data.subcategory_id,
        }));

        if (transaction) form.put(`/money/transactions/${transaction.id}`, { preserveScroll: true, onSuccess: onClose });
        else form.post('/money/transactions', { preserveScroll: true, onSuccess: onClose });
    }

    function destroy() {
        if (!transaction) return;

        router.delete(`/money/transactions/${transaction.id}`, { preserveScroll: true, onSuccess: onClose });
    }

    if (transaction && !editing) {
        return (
            <>
                <MoneyDrawer onClose={onClose} open title="Transaction details">
                    <div className="rounded-[1.5rem] border border-border-subtle bg-app p-5">
                        <div className="flex items-center justify-between gap-3">
                            <StatusChip status={transaction.type === 'income' ? 'completed' : transaction.type === 'expense' ? 'danger' : 'active'}>
                                {transaction.type}
                            </StatusChip>
                            <p className="text-sm font-semibold text-muted">{formatMoneyDate(transaction.date)}</p>
                        </div>
                        <p className={classNames(
                            'mt-5 text-4xl font-bold tracking-[-0.04em] tabular-nums',
                            transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-foreground' : 'text-[var(--money-accent)]',
                        )}>
                            {formatMinorUnits(transaction.amountMinor, transaction.account.currency)}
                        </p>
                        <p className="mt-2 font-bold text-secondary">{transactionTitle(transaction)}</p>
                        <dl className="mt-6 divide-y divide-border-subtle text-sm">
                            <div className="py-3"><dt className="text-muted">Account{transaction.type === 'transfer' ? 's' : ''}</dt><dd className="mt-1 font-semibold">{transaction.type === 'transfer' ? `${transaction.account.name} → ${transaction.destinationAccount?.name}` : transaction.account.name}</dd></div>
                            {transaction.type === 'transfer' && (
                                <>
                                    <div className="py-3"><dt className="text-muted">Destination receives</dt><dd className="mt-1 font-semibold tabular-nums">{formatMinorUnits(transaction.destinationCreditMinor ?? transaction.amountMinor, transaction.account.currency)}</dd></div>
                                    <div className="py-3"><dt className="text-muted">Transfer fee · Financial → Bank Fees</dt><dd className="mt-1 font-semibold tabular-nums">{formatMinorUnits(transaction.feeMinor, transaction.account.currency)}</dd></div>
                                    <div className="py-3"><dt className="text-muted">Source debit</dt><dd className="mt-1 font-semibold tabular-nums">{formatMinorUnits(transaction.sourceDebitMinor ?? transaction.amountMinor, transaction.account.currency)}</dd></div>
                                </>
                            )}
                            {transaction.note && <div className="py-3"><dt className="text-muted">Note</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{transaction.note}</dd></div>}
                        </dl>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <Button className="flex-1" onClick={() => setEditing(true)}><Pencil aria-hidden="true" size={16} />Edit</Button>
                        <Button onClick={() => setDeleteConfirmationOpen(true)} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete</Button>
                    </div>
                </MoneyDrawer>
                <MoneyConfirmationDialog
                    confirmLabel="Delete transaction"
                    destructive
                    description="This permanently removes the record and reverses its complete effect on the involved Account balances."
                    onClose={() => setDeleteConfirmationOpen(false)}
                    onConfirm={destroy}
                    open={deleteConfirmationOpen}
                    title="Delete this transaction?"
                />
            </>
        );
    }

    return (
        <MoneyDrawer onClose={onClose} open title={transaction ? `Edit ${transaction.type}` : `New ${type}`}>
            <form className="space-y-6" onSubmit={submit}>
                {!transaction && <TransactionTypeControl onChange={chooseType} value={type} />}

                <div>
                    <label className="text-sm font-semibold text-secondary" htmlFor="money-amount">{type === 'transfer' ? 'Destination receives' : 'Amount'}</label>
                    <div className={classNames('mt-2 flex items-center rounded-2xl border bg-app transition-colors focus-within:border-[var(--money-accent)]', form.errors.amount ? 'border-danger' : 'border-border-strong')}>
                        <input
                            aria-invalid={Boolean(form.errors.amount)}
                            autoFocus={!transaction}
                            className="focus-ring min-w-0 flex-1 bg-transparent px-4 py-4 text-3xl font-bold tracking-[-0.04em] text-foreground tabular-nums placeholder:text-muted"
                            id="money-amount"
                            inputMode="decimal"
                            onChange={(event) => form.setData('amount', event.target.value)}
                            placeholder="0.00"
                            required
                            value={form.data.amount}
                        />
                        <span className="pr-4 text-sm font-bold tracking-[0.12em] text-[var(--money-accent)]">{selectedAccount?.currency ?? '—'}</span>
                    </div>
                    {form.errors.amount && <p className="mt-2 text-sm font-medium text-danger">{form.errors.amount}</p>}
                </div>

                <SelectField
                    error={form.errors.account_id}
                    label={type === 'transfer' ? 'From Account' : 'Account'}
                    onChange={(event) => chooseAccount(Number(event.target.value))}
                    options={[{ label: 'Choose Account', value: '' }, ...accountsWithHistory.map((account) => ({ label: `${account.name} · ${account.currency}`, value: String(account.id) }))]}
                    required
                    value={form.data.account_id}
                />

                {type === 'transfer' ? (
                    <div className="space-y-3">
                        <SelectField
                            error={form.errors.destination_account_id}
                            label="To Account"
                            onChange={(event) => form.setData('destination_account_id', Number(event.target.value))}
                            options={[{ label: 'Choose matching-currency Account', value: '' }, ...matchingDestinations.map((account) => ({ label: `${account.name} · ${account.currency}`, value: String(account.id) }))]}
                            required
                            value={form.data.destination_account_id}
                        />
                        <div>
                            <label className="text-sm font-semibold text-secondary" htmlFor="money-fee">Transfer fee</label>
                            <div className={classNames('mt-2 flex items-center rounded-2xl border bg-app transition-colors focus-within:border-[var(--money-accent)]', form.errors.fee ? 'border-danger' : 'border-border-strong')}>
                                <input
                                    aria-invalid={Boolean(form.errors.fee)}
                                    className="focus-ring min-w-0 flex-1 bg-transparent px-4 py-3 text-lg font-bold text-foreground tabular-nums"
                                    id="money-fee"
                                    inputMode="decimal"
                                    onChange={(event) => form.setData('fee', event.target.value)}
                                    placeholder="0.00"
                                    value={form.data.fee}
                                />
                                <span className="pr-4 text-sm font-bold tracking-[0.12em] text-[var(--money-accent)]">{selectedAccount?.currency ?? '—'}</span>
                            </div>
                            {form.errors.fee && <p className="mt-2 text-sm font-medium text-danger">{form.errors.fee}</p>}
                            <p className="mt-2 text-xs text-muted">The fee uses the source Account currency and is reported under Financial → Bank Fees.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border-subtle bg-surface p-4 text-sm">
                            <div><span className="block text-muted">Source debit</span><strong className="mt-1 block tabular-nums">{formatMinorUnits(inputMinorUnits(form.data.amount) + inputMinorUnits(form.data.fee), selectedAccount?.currency ?? '—')}</strong></div>
                            <div><span className="block text-muted">Destination credit</span><strong className="mt-1 block tabular-nums">{formatMinorUnits(inputMinorUnits(form.data.amount), selectedAccount?.currency ?? '—')}</strong></div>
                        </div>
                        {selectedAccount && matchingDestinations.length === 0 && (
                            <p className="rounded-2xl border border-warning/25 bg-warning/8 px-4 py-3 text-sm text-secondary">
                                No other active {selectedAccount.currency} Account is available. Transfers do not perform currency conversion.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        <SelectField
                            error={form.errors.category_id}
                            label="Category"
                            onChange={(event) => form.setData({ ...form.data, category_id: Number(event.target.value), subcategory_id: '' })}
                            options={[{ label: 'Choose Category', value: '' }, ...relevantCategories.map((category) => ({ label: category.name, value: String(category.id) }))]}
                            required
                            value={form.data.category_id}
                        />
                        {relevantCategories.length === 0 && (
                            <p className="rounded-2xl border border-warning/25 bg-warning/8 px-4 py-3 text-sm text-secondary">
                                No active {type} Categories are available. <Link className="font-bold text-[var(--money-accent)] hover:underline" href="/money/categories">Create one in Categories</Link> before recording this transaction.
                            </p>
                        )}
                        {subcategories.length > 0 && (
                            <SelectField
                                error={form.errors.subcategory_id}
                                label="Subcategory (optional)"
                                onChange={(event) => form.setData('subcategory_id', event.target.value ? Number(event.target.value) : '')}
                                options={[{ label: 'None', value: '' }, ...subcategories.map((subcategory) => ({ label: subcategory.name, value: String(subcategory.id) }))]}
                                value={form.data.subcategory_id}
                            />
                        )}
                    </div>
                )}

                <div className="rounded-2xl border border-border-subtle bg-surface p-4">
                    <p className="mb-4 text-xs font-bold tracking-[0.15em] text-muted uppercase">Details</p>
                    <div className="space-y-5">
                        <Field error={form.errors.date} label="Date" max={today} onChange={(event) => form.setData('date', event.target.value)} required type="date" value={form.data.date} />
                        <div>
                            <label className="text-sm font-semibold text-secondary" htmlFor="money-note">Note (optional)</label>
                            <textarea className="focus-ring mt-2 min-h-24 w-full resize-y rounded-2xl border border-border-strong bg-app px-4 py-3 text-foreground" id="money-note" maxLength={1000} onChange={(event) => form.setData('note', event.target.value)} placeholder="What was this for?" value={form.data.note} />
                            {form.errors.note && <p className="mt-2 text-sm text-danger">{form.errors.note}</p>}
                        </div>
                    </div>
                </div>

                <Button disabled={form.processing || (type !== 'transfer' && relevantCategories.length === 0) || (type === 'transfer' && matchingDestinations.length === 0)} fullWidth type="submit">
                    {transaction ? <Pencil aria-hidden="true" size={17} /> : <Plus aria-hidden="true" size={17} />}
                    {transaction ? 'Save changes' : `Add ${type}`}
                </Button>
            </form>
        </MoneyDrawer>
    );
}

function inputMinorUnits(value: string): number {
    if (!/^\d{1,12}(?:\.\d{0,2})?$/.test(value)) return 0;

    const [whole, fraction = ''] = value.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
