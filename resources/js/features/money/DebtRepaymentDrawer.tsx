import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Checkbox, Field, SelectField } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import { minorUnitsInput } from './moneyPresentation';
import type { MoneyDebtAccountOption, MoneyDebtData } from './types';

interface RepaymentPayload {
    amount: string;
    track_account: boolean;
    account_id: number | '';
    settled_on: string;
    note: string;
}

export function DebtRepaymentDrawer({ debt, accounts, today, onClose }: { debt: MoneyDebtData; accounts: MoneyDebtAccountOption[]; today: string; onClose: () => void }) {
    const matchingAccounts = accounts.filter((account) => account.currency === debt.currency);
    const form = useForm<RepaymentPayload>({
        amount: minorUnitsInput(debt.remainingAmountMinor),
        track_account: matchingAccounts.length > 0,
        account_id: matchingAccounts[0]?.id ?? '',
        settled_on: today,
        note: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({ ...data, account_id: data.track_account ? data.account_id : null, note: data.note || null }));
        form.post(`/money/debts/${debt.id}/repayments`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer description={debt.direction === 'payable' ? `Record money you paid to ${debt.person.name}.` : `Record money received from ${debt.person.name}.`} onClose={onClose} open title="Record repayment">
            <form className="space-y-6" onSubmit={submit}>
                <Field error={form.errors.amount} inputMode="decimal" label={`Amount · ${debt.currency}`} onChange={(event) => form.setData('amount', event.target.value)} required value={form.data.amount} />
                <Checkbox checked={form.data.track_account} description={debt.direction === 'payable' ? 'Remove this repayment from an Account.' : 'Add this repayment to an Account.'} disabled={matchingAccounts.length === 0} label="Record Account movement" onChange={(event) => form.setData({ ...form.data, track_account: event.target.checked, account_id: event.target.checked ? matchingAccounts[0]?.id ?? '' : '' })} />
                {form.data.track_account && <SelectField error={form.errors.account_id} label={debt.direction === 'payable' ? 'Pay from Account' : 'Receive into Account'} onChange={(event) => form.setData('account_id', Number(event.target.value))} options={matchingAccounts.map((account) => ({ label: `${account.name} · ${account.currency}`, value: String(account.id) }))} required value={form.data.account_id} />}
                <Field error={form.errors.settled_on} label="Repayment date" max={today} min={debt.openedOn} onChange={(event) => form.setData('settled_on', event.target.value)} required type="date" value={form.data.settled_on} />
                <Field error={form.errors.note} label="Note (optional)" maxLength={1000} onChange={(event) => form.setData('note', event.target.value)} value={form.data.note} />
                <Button disabled={form.processing} fullWidth type="submit">Record repayment</Button>
            </form>
        </MoneyDrawer>
    );
}
