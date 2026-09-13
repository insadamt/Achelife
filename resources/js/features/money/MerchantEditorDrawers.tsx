import { useForm } from '@inertiajs/react';
import { Plus, Save } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import type { MoneyMerchantData } from './types';

export function MerchantCreateDrawer({ onClose }: { onClose: () => void }) {
    const form = useForm<{ name: string }>({ name: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/money/merchants', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title="New Merchant">
            <form className="space-y-6" onSubmit={submit}>
                <Field autoFocus error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} placeholder="Steam" required value={form.data.name} />
                <Button disabled={form.processing || form.data.name.trim() === ''} fullWidth type="submit"><Plus aria-hidden="true" size={17} />Create Merchant</Button>
            </form>
        </MoneyDrawer>
    );
}

export function MerchantRenameDrawer({ merchant, onClose }: { merchant: MoneyMerchantData; onClose: () => void }) {
    const form = useForm<{ name: string }>({ name: merchant.name });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/money/merchants/${merchant.id}`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title="Rename Merchant">
            <form className="space-y-6" onSubmit={submit}>
                <Field autoFocus error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} required value={form.data.name} />
                <Button disabled={form.processing || form.data.name.trim() === merchant.name} fullWidth type="submit"><Save aria-hidden="true" size={17} />Save name</Button>
            </form>
        </MoneyDrawer>
    );
}
