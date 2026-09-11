import { useForm } from '@inertiajs/react';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Checkbox, Field, SelectField } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { MoneyDrawer } from './MoneyDrawer';
import type { MoneyDebtAccountOption, MoneyDebtDirection, MoneyDebtPersonData } from './types';

interface DebtPayload {
    direction: MoneyDebtDirection;
    amount: string;
    create_person: boolean;
    person_id: number | '';
    person_name: string;
    person_nickname: string;
    account_id: number | '';
    opened_on: string;
    due_on: string;
    note: string;
}

export function DebtComposerDrawer({
    accounts,
    people,
    today,
    onClose,
}: {
    accounts: MoneyDebtAccountOption[];
    people: MoneyDebtPersonData[];
    today: string;
    onClose: () => void;
}) {
    const firstAccount = accounts[0];
    const form = useForm<DebtPayload>({
        direction: 'receivable',
        amount: '',
        create_person: people.length === 0,
        person_id: people[0]?.id ?? '',
        person_name: '',
        person_nickname: '',
        account_id: firstAccount?.id ?? '',
        opened_on: today,
        due_on: '',
        note: '',
    });
    const selectedAccount = accounts.find((account) => account.id === Number(form.data.account_id));

    function selectAccount(accountId: number | '') {
        form.setData('account_id', accountId);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            person_id: data.create_person ? null : data.person_id,
            person_name: data.create_person ? data.person_name : null,
            person_nickname: data.create_person && data.person_nickname ? data.person_nickname : null,
            due_on: data.due_on || null,
            note: data.note || null,
        }));
        form.post('/money/debts', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer description="Record one agreement. Each later repayment keeps its own date and Account." onClose={onClose} open title="New debt">
            <form className="space-y-6" onSubmit={submit}>
                <fieldset>
                    <legend className="mb-2 text-sm font-semibold text-secondary">What happened?</legend>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border-subtle bg-app p-1.5">
                        <DirectionButton direction="receivable" icon={ArrowUpFromLine} label="I lent money" onSelect={(direction) => form.setData('direction', direction)} selected={form.data.direction === 'receivable'} />
                        <DirectionButton direction="payable" icon={ArrowDownToLine} label="I borrowed" onSelect={(direction) => form.setData('direction', direction)} selected={form.data.direction === 'payable'} />
                    </div>
                    <p className="mt-2 text-xs text-muted">{form.data.direction === 'receivable' ? 'This Person will owe you.' : 'You will owe this Person.'}</p>
                </fieldset>

                <Checkbox checked={form.data.create_person} description="Create the Person together with this debt." label="Add a new Person" onChange={(event) => form.setData('create_person', event.target.checked)} />
                {form.data.create_person ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field error={form.errors.person_name} label="Person name" onChange={(event) => form.setData('person_name', event.target.value)} required value={form.data.person_name} />
                        <Field error={form.errors.person_nickname} label="Nickname (optional)" onChange={(event) => form.setData('person_nickname', event.target.value)} value={form.data.person_nickname} />
                    </div>
                ) : (
                    <SelectField error={form.errors.person_id} label="Person" onChange={(event) => form.setData('person_id', Number(event.target.value))} options={[{ label: 'Choose Person', value: '' }, ...people.map((person) => ({ label: person.nickname ? `${person.name} · ${person.nickname}` : person.name, value: String(person.id) }))]} required value={form.data.person_id} />
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field error={form.errors.amount} inputMode="decimal" label="Amount" onChange={(event) => form.setData('amount', event.target.value)} placeholder="0.00" required value={form.data.amount} />
                    <Field disabled label="Currency" value={selectedAccount?.currency ?? 'Choose an Account'} />
                </div>

                {accounts.length > 0 ? (
                    <SelectField error={form.errors.account_id} label={form.data.direction === 'receivable' ? 'Lend from Account' : 'Deposit into Account'} onChange={(event) => selectAccount(Number(event.target.value))} options={[{ label: 'Choose Account', value: '' }, ...accounts.map((account) => ({ label: `${account.name} · ${account.currency}`, value: String(account.id) }))]} required value={form.data.account_id} />
                ) : (
                    <p className="rounded-2xl border border-warning/30 bg-warning/8 px-4 py-3 text-sm text-warning">Create an active Account before recording a debt. Every loan and borrowing must move money through an Account.</p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field error={form.errors.opened_on} label="Date" max={today} onChange={(event) => form.setData('opened_on', event.target.value)} required type="date" value={form.data.opened_on} />
                    <Field error={form.errors.due_on} label="Due date (optional)" min={form.data.opened_on} onChange={(event) => form.setData('due_on', event.target.value)} type="date" value={form.data.due_on} />
                </div>
                <Field error={form.errors.note} label="Note (optional)" maxLength={1000} onChange={(event) => form.setData('note', event.target.value)} value={form.data.note} />

                <Button disabled={form.processing || accounts.length === 0} fullWidth type="submit">Create debt</Button>
            </form>
        </MoneyDrawer>
    );
}

function DirectionButton({ direction, icon: Icon, label, onSelect, selected }: { direction: MoneyDebtDirection; icon: typeof ArrowDownToLine; label: string; onSelect: (direction: MoneyDebtDirection) => void; selected: boolean }) {
    return (
        <button aria-pressed={selected} className={classNames('focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition-colors', selected ? 'border-[color-mix(in_srgb,var(--money-accent)_40%,transparent)] bg-elevated text-foreground shadow-sm' : 'border-transparent text-muted hover:text-foreground')} onClick={() => onSelect(direction)} type="button">
            <Icon aria-hidden="true" size={17} />{label}
        </button>
    );
}
