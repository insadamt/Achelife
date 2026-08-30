import { Link, router, useForm } from '@inertiajs/react';
import { Check, ExternalLink, SkipForward } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, SelectField, StatusChip } from '../../components/ui';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
import { formatMinorUnits, formatMoneyDate, minorUnitsInput } from './moneyPresentation';
import type { MoneyAccountData, MoneyCategoryData, MoneySubscriptionOccurrenceData } from './types';

interface PaymentPayload {
    amount: string;
    account_id: number | '';
    category_id: number | '';
    subcategory_id: number | '';
    note: string;
    apply_to_future: boolean;
}

export function SubscriptionOccurrenceDrawer({
    accounts,
    categories,
    occurrence,
    onClose,
}: {
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    occurrence: MoneySubscriptionOccurrenceData;
    onClose: () => void;
}) {
    const [skipConfirmationOpen, setSkipConfirmationOpen] = useState(false);
    const form = useForm<PaymentPayload>({
        amount: minorUnitsInput(occurrence.amountMinor),
        account_id: occurrence.account.id,
        category_id: occurrence.category.id,
        subcategory_id: occurrence.subcategory?.id ?? '',
        note: occurrence.note ?? '',
        apply_to_future: false,
    });
    const availableAccounts = retainedAccounts(accounts, occurrence);
    const availableCategories = categories.filter((category) => category.archivedAt === null || category.id === Number(form.data.category_id));
    const category = availableCategories.find((item) => item.id === Number(form.data.category_id));
    const subcategories = category?.subcategories.filter((item) => item.archivedAt === null || item.id === Number(form.data.subcategory_id)) ?? [];
    const selectedAccount = availableAccounts.find((account) => account.id === Number(form.data.account_id));

    function pay(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({ ...data, subcategory_id: data.subcategory_id === '' ? null : data.subcategory_id }));
        form.post(`/money/subscription-occurrences/${occurrence.id}/pay`, { preserveScroll: true, onSuccess: onClose });
    }

    function skip() {
        router.post(`/money/subscription-occurrences/${occurrence.id}/skip`, {}, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <>
            <MoneyDrawer onClose={onClose} open title={`${occurrence.subscriptionName} payment`}>
                <div className="rounded-2xl border border-border-subtle bg-app p-5">
                    <div className="flex items-center justify-between gap-3">
                        <StatusChip status={occurrence.status === 'paid' ? 'completed' : occurrence.status === 'skipped' ? 'neutral' : occurrence.overdue ? 'danger' : 'active'}>
                            {occurrence.status === 'due' && occurrence.overdue ? 'overdue' : occurrence.status}
                        </StatusChip>
                        <span className="text-sm font-semibold text-muted">{formatMoneyDate(occurrence.dueDate)}</span>
                    </div>
                    <p className="mt-4 text-3xl font-bold tabular-nums">{formatMinorUnits(occurrence.amountMinor, occurrence.currency)}</p>
                    <p className="mt-2 text-sm text-secondary">{occurrence.account.name} · {occurrence.category.name}{occurrence.subcategory ? ` → ${occurrence.subcategory.name}` : ''}</p>
                    {occurrence.note && <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{occurrence.note}</p>}
                    {occurrence.transactionId && (
                        <Link className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--money-accent)] hover:underline" href="/money/history">
                            Linked Expense #{occurrence.transactionId} <ExternalLink aria-hidden="true" size={14} />
                        </Link>
                    )}
                </div>

                {occurrence.status === 'due' && (
                    <form className="mt-6 space-y-5" onSubmit={pay}>
                        <div>
                            <label className="text-sm font-semibold text-secondary" htmlFor="subscription-payment-amount">Payment amount</label>
                            <div className="mt-2 flex items-center rounded-2xl border border-border-strong bg-app focus-within:border-[var(--money-accent)]">
                                <input className="focus-ring min-w-0 flex-1 bg-transparent px-4 py-3 text-xl font-bold tabular-nums" id="subscription-payment-amount" inputMode="decimal" onChange={(event) => form.setData('amount', event.target.value)} required value={form.data.amount} />
                                <span className="pr-4 text-sm font-bold text-[var(--money-accent)]">{selectedAccount?.currency ?? occurrence.currency}</span>
                            </div>
                            {form.errors.amount && <p className="mt-2 text-sm text-danger">{form.errors.amount}</p>}
                        </div>
                        <SelectField error={form.errors.account_id} label="Account" onChange={(event) => form.setData('account_id', Number(event.target.value))} options={availableAccounts.map((account) => ({ label: `${account.name} · ${account.currency}${account.archivedAt ? ' · Archived' : ''}`, value: String(account.id) }))} value={form.data.account_id} />
                        <SelectField error={form.errors.category_id} label="Expense Category" onChange={(event) => form.setData({ ...form.data, category_id: Number(event.target.value), subcategory_id: '' })} options={availableCategories.map((item) => ({ label: `${item.name}${item.archivedAt ? ' · Archived' : ''}`, value: String(item.id) }))} value={form.data.category_id} />
                        {subcategories.length > 0 && <SelectField error={form.errors.subcategory_id} label="Subcategory (optional)" onChange={(event) => form.setData('subcategory_id', event.target.value ? Number(event.target.value) : '')} options={[{ label: 'None', value: '' }, ...subcategories.map((item) => ({ label: item.name, value: String(item.id) }))]} value={form.data.subcategory_id} />}
                        <div>
                            <label className="text-sm font-semibold text-secondary" htmlFor="subscription-payment-note">Note (optional)</label>
                            <textarea className="focus-ring mt-2 min-h-20 w-full rounded-2xl border border-border-strong bg-app px-4 py-3" id="subscription-payment-note" maxLength={1000} onChange={(event) => form.setData('note', event.target.value)} value={form.data.note} />
                        </div>
                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-4">
                            <input checked={form.data.apply_to_future} className="mt-0.5 size-4 accent-[var(--money-accent)]" onChange={(event) => form.setData('apply_to_future', event.target.checked)} type="checkbox" />
                            <span><strong className="block text-sm">Apply these values to future payments</strong><span className="mt-1 block text-xs text-muted">Leave off for a one-payment override. The recurrence itself never changes here.</span></span>
                        </label>
                        <div className="flex gap-2">
                            <Button className="flex-1" disabled={form.processing} type="submit"><Check aria-hidden="true" size={17} />Pay</Button>
                            <Button onClick={() => setSkipConfirmationOpen(true)} type="button" variant="secondary"><SkipForward aria-hidden="true" size={17} />Skip</Button>
                        </div>
                    </form>
                )}
            </MoneyDrawer>
            <MoneyConfirmationDialog confirmLabel="Skip payment" description="This occurrence stays in history as Skipped and no Expense will be recorded." onClose={() => setSkipConfirmationOpen(false)} onConfirm={skip} open={skipConfirmationOpen} title="Skip this payment?" />
        </>
    );
}

function retainedAccounts(accounts: MoneyAccountData[], occurrence: MoneySubscriptionOccurrenceData) {
    if (accounts.some((account) => account.id === occurrence.account.id)) return accounts.filter((account) => account.archivedAt === null || account.id === occurrence.account.id);
    return [...accounts.filter((account) => account.archivedAt === null), {
        id: occurrence.account.id, name: occurrence.account.name, currency: occurrence.currency, archivedAt: new Date(0).toISOString(),
        initialBalanceMinor: 0, balanceMinor: 0, themeIndex: 0, visualIdentifier: '0000', hasHistory: true, canDelete: false,
    }];
}
