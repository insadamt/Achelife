import { router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Drawer, Field, SelectField } from '../../components/ui';
import { formatMinorUnits, formatMoneyDate, minorUnitsInput, transactionTitle } from './moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneyTransactionData, MoneyTransactionType } from './types';

interface TransactionPayload {
    type: MoneyTransactionType;
    amount: string;
    account_id: number | '';
    destination_account_id: number | '';
    category_id: number | '';
    subcategory_id: number | '';
    date: string;
    note: string;
}

function accountOptions(accounts: MoneyAccountData[], transaction: MoneyTransactionData | null) {
    const options = accounts.map((account) => ({ id: account.id, name: account.name, currency: account.currency }));
    for (const account of [transaction?.account, transaction?.destinationAccount]) {
        if (account && !options.some((option) => option.id === account.id)) options.push(account);
    }
    return options;
}

export function TransactionDrawer({ accounts, categories, today, transaction = null, initialType = null, initialAccountId, onClose }: {
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    today: string;
    transaction?: MoneyTransactionData | null;
    initialType?: MoneyTransactionType | null;
    initialAccountId?: number;
    onClose: () => void;
}) {
    const [editing, setEditing] = useState(transaction === null);
    const [chosenType, setChosenType] = useState<MoneyTransactionType | null>(transaction?.type ?? initialType);
    const accountsWithHistory = useMemo(() => accountOptions(accounts, transaction), [accounts, transaction]);
    const form = useForm<TransactionPayload>({
        type: transaction?.type ?? initialType ?? 'expense',
        amount: transaction ? minorUnitsInput(transaction.amountMinor) : '',
        account_id: transaction?.account.id ?? initialAccountId ?? accounts[0]?.id ?? '',
        destination_account_id: transaction?.destinationAccount?.id ?? '',
        category_id: transaction?.category?.id ?? '',
        subcategory_id: transaction?.subcategory?.id ?? '',
        date: transaction?.date ?? today,
        note: transaction?.note ?? '',
    });
    const type = chosenType ?? form.data.type;
    const selectedAccount = accountsWithHistory.find((account) => account.id === Number(form.data.account_id));
    const matchingDestinations = accountsWithHistory.filter((account) => account.id !== Number(form.data.account_id) && account.currency === selectedAccount?.currency);
    const relevantCategories = categories.filter((category) => category.type === type && (category.archivedAt === null || category.id === Number(form.data.category_id)));
    const selectedCategory = relevantCategories.find((category) => category.id === Number(form.data.category_id));
    const subcategories = selectedCategory?.subcategories.filter((subcategory) => subcategory.archivedAt === null || subcategory.id === Number(form.data.subcategory_id)) ?? [];

    function chooseType(nextType: MoneyTransactionType) {
        setChosenType(nextType);
        form.setData({ ...form.data, type: nextType, destination_account_id: '', category_id: '', subcategory_id: '' });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            type,
            destination_account_id: type === 'transfer' ? data.destination_account_id : null,
            category_id: type === 'transfer' ? null : data.category_id,
            subcategory_id: type === 'transfer' || data.subcategory_id === '' ? null : data.subcategory_id,
        }));
        if (transaction) form.put(`/money/transactions/${transaction.id}`, { preserveScroll: true, onSuccess: onClose });
        else form.post('/money/transactions', { preserveScroll: true, onSuccess: onClose });
    }

    function destroy() {
        if (transaction && window.confirm('Delete this transaction permanently? Its complete financial effect will be reversed.')) {
            router.delete(`/money/transactions/${transaction.id}`, { preserveScroll: true, onSuccess: onClose });
        }
    }

    if (transaction && !editing) {
        return (
            <Drawer description="A single financial history item." onClose={onClose} open title="Transaction details">
                <div className="rounded-[1.5rem] border border-border-subtle bg-app p-5">
                    <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">{transaction.type}</p>
                    <p className={`mt-2 text-4xl font-bold ${transaction.type === 'income' ? 'text-success' : transaction.type === 'expense' ? 'text-foreground' : 'text-[var(--money-accent)]'}`}>{formatMinorUnits(transaction.amountMinor, transaction.account.currency)}</p>
                    <dl className="mt-6 space-y-4 text-sm">
                        <div><dt className="text-muted">Operation</dt><dd className="mt-1 font-semibold">{transactionTitle(transaction)}</dd></div>
                        <div><dt className="text-muted">Account{transaction.type === 'transfer' ? 's' : ''}</dt><dd className="mt-1 font-semibold">{transaction.type === 'transfer' ? `${transaction.account.name} → ${transaction.destinationAccount?.name}` : transaction.account.name}</dd></div>
                        <div><dt className="text-muted">Date</dt><dd className="mt-1 font-semibold">{formatMoneyDate(transaction.date)}</dd></div>
                        {transaction.note && <div><dt className="text-muted">Note</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{transaction.note}</dd></div>}
                    </dl>
                </div>
                <div className="mt-6 flex gap-2"><Button className="flex-1" onClick={() => setEditing(true)}>Edit</Button><Button onClick={destroy} variant="destructive">Delete</Button></div>
            </Drawer>
        );
    }

    return (
        <Drawer description={transaction ? 'Corrections immediately replace the previous financial effect.' : 'Record actual money movement. No SP is involved.'} onClose={onClose} open title={transaction ? `Edit ${transaction.type}` : chosenType ? `New ${chosenType}` : 'New transaction'}>
            {!transaction && chosenType === null ? (
                <div className="grid gap-3">
                    {(['income', 'expense', 'transfer'] as const).map((item) => <button className="focus-ring rounded-2xl border border-border-strong bg-app px-5 py-5 text-left text-lg font-bold capitalize transition-colors hover:border-[var(--money-accent)] hover:bg-surface-hover" key={item} onClick={() => chooseType(item)} type="button">{item}<span className="mt-1 block text-sm font-normal text-muted">{item === 'income' ? 'Money received' : item === 'expense' ? 'Money spent' : 'Move between matching-currency Accounts'}</span></button>)}
                </div>
            ) : (
                <form className="space-y-5" onSubmit={submit}>
                    {!transaction && <div className="grid grid-cols-3 gap-2">{(['income', 'expense', 'transfer'] as const).map((item) => <button aria-pressed={type === item} className={`focus-ring rounded-xl border px-2 py-3 text-xs font-bold uppercase ${type === item ? 'border-[var(--money-accent)] bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)]' : 'border-border-strong bg-app'}`} key={item} onClick={() => chooseType(item)} type="button">{item}</button>)}</div>}
                    <div className="grid grid-cols-[1fr_auto] items-end gap-3"><Field error={form.errors.amount} inputMode="decimal" label="Amount" onChange={(event) => form.setData('amount', event.target.value)} placeholder="0.00" required value={form.data.amount} /><span className="mb-3 font-bold text-[var(--money-accent)]">{selectedAccount?.currency ?? '—'}</span></div>
                    <SelectField error={form.errors.account_id} label={type === 'transfer' ? 'From' : 'Account'} onChange={(event) => form.setData('account_id', Number(event.target.value))} options={[{ label: 'Choose Account', value: '' }, ...accountsWithHistory.map((account) => ({ label: `${account.name} · ${account.currency}`, value: String(account.id) }))]} required value={form.data.account_id} />
                    {type === 'transfer' ? <><SelectField error={form.errors.destination_account_id} label="To" onChange={(event) => form.setData('destination_account_id', Number(event.target.value))} options={[{ label: 'Choose matching-currency Account', value: '' }, ...matchingDestinations.map((account) => ({ label: `${account.name} · ${account.currency}`, value: String(account.id) }))]} required value={form.data.destination_account_id} /><p className="text-sm text-muted">Transfers require matching currencies. No conversion is performed.</p></> : <><SelectField error={form.errors.category_id} label="Category" onChange={(event) => form.setData({ ...form.data, category_id: Number(event.target.value), subcategory_id: '' })} options={[{ label: 'Choose Category', value: '' }, ...relevantCategories.map((category) => ({ label: category.name, value: String(category.id) }))]} required value={form.data.category_id} />{subcategories.length > 0 && <SelectField error={form.errors.subcategory_id} label="Subcategory (optional)" onChange={(event) => form.setData('subcategory_id', event.target.value ? Number(event.target.value) : '')} options={[{ label: 'None', value: '' }, ...subcategories.map((subcategory) => ({ label: subcategory.name, value: String(subcategory.id) }))]} value={form.data.subcategory_id} />}</>}
                    <Field error={form.errors.date} label="Date" max={today} onChange={(event) => form.setData('date', event.target.value)} required type="date" value={form.data.date} />
                    <div><label className="text-sm font-semibold text-secondary" htmlFor="money-note">Note (optional)</label><textarea className="focus-ring mt-2 min-h-24 w-full resize-y rounded-2xl border border-border-strong bg-app px-4 py-3 text-foreground" id="money-note" maxLength={1000} onChange={(event) => form.setData('note', event.target.value)} value={form.data.note} />{form.errors.note && <p className="mt-2 text-sm text-danger">{form.errors.note}</p>}</div>
                    <Button disabled={form.processing} fullWidth type="submit">{transaction ? 'Save correction' : `Add ${type}`}</Button>
                </form>
            )}
        </Drawer>
    );
}
