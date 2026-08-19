import { useForm } from '@inertiajs/react';
import { Plus, Save } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import { minorUnitsInput } from './moneyPresentation';
import type { MoneyAccountData } from './types';

interface AccountPayload {
    name: string;
    currency: string;
    initial_balance: string;
}

export function AccountFormDrawer({ account = null, onClose }: { account?: MoneyAccountData | null; onClose: () => void }) {
    const form = useForm<AccountPayload>({
        name: account?.name ?? '',
        currency: account?.currency ?? 'MAD',
        initial_balance: account ? minorUnitsInput(account.initialBalanceMinor) : '0.00',
    });
    const locked = account?.hasHistory ?? false;

    function submit(event: FormEvent) {
        event.preventDefault();
        if (account) form.put(`/money/accounts/${account.id}`, { preserveScroll: true, onSuccess: onClose });
        else form.post('/money/accounts', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title={account ? 'Edit Account' : 'New Account'}>
            <form className="space-y-6" onSubmit={submit}>
                <Field autoComplete="off" error={form.errors.name} label="Account name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} placeholder="Cash" required value={form.data.name} />
                <Field autoComplete="off" disabled={locked} error={form.errors.currency} label="Currency code" maxLength={3} minLength={3} onChange={(event) => form.setData('currency', event.target.value.toUpperCase())} pattern="[A-Za-z]{3}" required value={form.data.currency} />
                <Field disabled={locked} error={form.errors.initial_balance} inputMode="decimal" label="Opening balance" onChange={(event) => form.setData('initial_balance', event.target.value)} required value={form.data.initial_balance} />
                {locked && <p className="rounded-2xl border border-warning/30 bg-warning/8 px-4 py-3 text-sm text-warning">Currency and opening balance are locked because this Account has financial history.</p>}
                <Button disabled={form.processing} fullWidth type="submit">
                    {account ? <Save aria-hidden="true" size={17} /> : <Plus aria-hidden="true" size={17} />}
                    {account ? 'Save Account' : 'Create Account'}
                </Button>
            </form>
        </MoneyDrawer>
    );
}
