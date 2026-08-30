import { useForm } from '@inertiajs/react';
import { CalendarClock, Plus, Save } from 'lucide-react';
import { useMemo } from 'react';
import type { FormEvent } from 'react';

import { Button, Field, SelectField } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import { formatMinorUnits, minorUnitsInput } from './moneyPresentation';
import { readableSchedule, schedulePreview } from './subscriptionSchedule';
import type { MoneyAccountData, MoneyCategoryData, MoneySubscriptionData, MoneySubscriptionPaymentMode, MoneySubscriptionRecurrence } from './types';

interface SubscriptionPayload {
    name: string;
    amount: string;
    account_id: number | '';
    category_id: number | '';
    subcategory_id: number | '';
    note: string;
    start_date: string;
    end_date: string;
    recurrence: MoneySubscriptionRecurrence;
    payment_mode: MoneySubscriptionPaymentMode;
}

export function SubscriptionComposerDrawer({
    accounts,
    categories,
    onClose,
    subscription = null,
    today,
}: {
    accounts: MoneyAccountData[];
    categories: MoneyCategoryData[];
    onClose: () => void;
    subscription?: MoneySubscriptionData | null;
    today: string;
}) {
    const form = useForm<SubscriptionPayload>({
        name: subscription?.name ?? '',
        amount: subscription ? minorUnitsInput(subscription.amountMinor) : '',
        account_id: subscription?.account.id ?? accounts.find((account) => account.archivedAt === null)?.id ?? '',
        category_id: subscription?.category.id ?? '',
        subcategory_id: subscription?.subcategory?.id ?? '',
        note: subscription?.note ?? '',
        start_date: subscription?.startsOn ?? today,
        end_date: subscription?.endsOn ?? '',
        recurrence: subscription?.recurrence ?? 'monthly',
        payment_mode: subscription?.paymentMode ?? 'manual',
    });
    const availableAccounts = accounts.filter((account) => account.archivedAt === null || account.id === Number(form.data.account_id));
    const availableCategories = categories.filter((category) => category.archivedAt === null || category.id === Number(form.data.category_id));
    const selectedAccount = availableAccounts.find((account) => account.id === Number(form.data.account_id));
    const selectedCategory = availableCategories.find((category) => category.id === Number(form.data.category_id));
    const availableSubcategories = selectedCategory?.subcategories.filter(
        (subcategory) => subcategory.archivedAt === null || subcategory.id === Number(form.data.subcategory_id),
    ) ?? [];
    const preview = useMemo(
        () => {
            const through = form.data.end_date && form.data.end_date < today ? form.data.end_date : today;
            const schedule = schedulePreview(form.data.start_date, through, form.data.recurrence);

            return form.data.end_date && schedule.next && schedule.next > form.data.end_date
                ? { ...schedule, next: null }
                : schedule;
        },
        [form.data.end_date, form.data.recurrence, form.data.start_date, today],
    );
    const amountMinor = inputMinorUnits(form.data.amount);

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            subcategory_id: data.subcategory_id === '' ? null : data.subcategory_id,
            end_date: data.end_date || null,
        }));
        if (subscription) form.put(`/money/subscriptions/${subscription.id}`, { preserveScroll: true, onSuccess: onClose });
        else form.post('/money/subscriptions', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title={subscription ? 'Edit Subscription' : 'New Subscription'}>
            <form className="space-y-5" onSubmit={submit}>
                <Field autoFocus error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} required value={form.data.name} />
                <div>
                    <label className="text-sm font-semibold text-secondary" htmlFor="subscription-amount">Amount</label>
                    <div className="mt-2 flex items-center rounded-2xl border border-border-strong bg-app focus-within:border-[var(--money-accent)]">
                        <input className="focus-ring min-w-0 flex-1 bg-transparent px-4 py-4 text-3xl font-bold tabular-nums" id="subscription-amount" inputMode="decimal" onChange={(event) => form.setData('amount', event.target.value)} placeholder="0.00" required value={form.data.amount} />
                        <span className="pr-4 text-sm font-bold text-[var(--money-accent)]">{selectedAccount?.currency ?? '—'}</span>
                    </div>
                    {form.errors.amount && <p className="mt-2 text-sm text-danger">{form.errors.amount}</p>}
                </div>

                <SelectField error={form.errors.account_id} label="Account" onChange={(event) => form.setData('account_id', Number(event.target.value))} options={[{ label: 'Choose Account', value: '' }, ...availableAccounts.map((account) => ({ label: `${account.name} · ${account.currency}${account.archivedAt ? ' · Archived' : ''}`, value: String(account.id) }))]} required value={form.data.account_id} />
                <SelectField error={form.errors.category_id} label="Expense Category" onChange={(event) => form.setData({ ...form.data, category_id: Number(event.target.value), subcategory_id: '' })} options={[{ label: 'Choose Category', value: '' }, ...availableCategories.map((category) => ({ label: `${category.name}${category.archivedAt ? ' · Archived' : ''}`, value: String(category.id) }))]} required value={form.data.category_id} />
                {availableSubcategories.length > 0 && (
                    <SelectField error={form.errors.subcategory_id} label="Subcategory (optional)" onChange={(event) => form.setData('subcategory_id', event.target.value ? Number(event.target.value) : '')} options={[{ label: 'None', value: '' }, ...availableSubcategories.map((subcategory) => ({ label: `${subcategory.name}${subcategory.archivedAt ? ' · Archived' : ''}`, value: String(subcategory.id) }))]} value={form.data.subcategory_id} />
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                    <Field error={form.errors.start_date} label="Start date" onChange={(event) => form.setData('start_date', event.target.value)} required type="date" value={form.data.start_date} />
                    <Field error={form.errors.end_date} label="End date (optional)" min={form.data.start_date} onChange={(event) => form.setData('end_date', event.target.value)} type="date" value={form.data.end_date} />
                    <SelectField error={form.errors.recurrence} label="Repeats" onChange={(event) => form.setData('recurrence', event.target.value as MoneySubscriptionRecurrence)} options={[
                        { label: 'Weekly', value: 'weekly' },
                        { label: 'Monthly', value: 'monthly' },
                        { label: 'Every three months', value: 'every_three_months' },
                        { label: 'Yearly', value: 'yearly' },
                    ]} value={form.data.recurrence} />
                    <SelectField error={form.errors.payment_mode} label="Payment mode" onChange={(event) => form.setData('payment_mode', event.target.value as MoneySubscriptionPaymentMode)} options={[
                        { label: 'Manual · remind me', value: 'manual' },
                        { label: 'Automatic · record Expense', value: 'automatic' },
                    ]} value={form.data.payment_mode} />
                </div>

                <div className="rounded-2xl border border-[color-mix(in_srgb,var(--money-accent)_25%,var(--border-subtle))] bg-surface p-4">
                    <p className="flex items-center gap-2 font-bold"><CalendarClock aria-hidden="true" size={17} /> {readableSchedule(form.data.start_date, form.data.recurrence)}</p>
                    <p className="mt-1 text-sm text-muted">Next payment: {(preview.next ?? form.data.start_date) || '—'}</p>
                    {form.data.start_date < today && preview.count > 0 && (
                        <p className="mt-3 text-sm text-secondary">
                            Catch-up preview: <strong>{preview.count} payment{preview.count === 1 ? '' : 's'}</strong> totaling <strong>{formatMinorUnits(preview.count * amountMinor, selectedAccount?.currency ?? '—')}</strong> through today.
                        </p>
                    )}
                    {form.data.payment_mode === 'automatic' && <p className="mt-2 text-xs text-muted">Automatic means Achelife records ordinary Expenses. It never sends money to a bank or merchant.</p>}
                </div>

                <div>
                    <label className="text-sm font-semibold text-secondary" htmlFor="subscription-note">Note (optional)</label>
                    <textarea className="focus-ring mt-2 min-h-24 w-full resize-y rounded-2xl border border-border-strong bg-app px-4 py-3" id="subscription-note" maxLength={1000} onChange={(event) => form.setData('note', event.target.value)} value={form.data.note} />
                    {form.errors.note && <p className="mt-2 text-sm text-danger">{form.errors.note}</p>}
                </div>

                <Button disabled={form.processing || availableAccounts.length === 0 || availableCategories.length === 0} fullWidth type="submit">
                    {subscription ? <Save aria-hidden="true" size={17} /> : <Plus aria-hidden="true" size={17} />}
                    {subscription ? 'Save future schedule' : 'Create Subscription'}
                </Button>
            </form>
        </MoneyDrawer>
    );
}

function inputMinorUnits(value: string) {
    if (!/^\d{1,12}(?:\.\d{0,2})?$/.test(value)) return 0;
    const [whole, fraction = ''] = value.split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
