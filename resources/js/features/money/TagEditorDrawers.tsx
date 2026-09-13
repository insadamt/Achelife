import { useForm } from '@inertiajs/react';
import { Plus, Save } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import type { MoneyTagManagementData } from './types';

const defaultColor = '#2563EB';

function TagForm({ action, initialColor, initialName, onClose, submitLabel }: { action: string; initialColor: string; initialName: string; onClose: () => void; submitLabel: string }) {
    const form = useForm({ name: initialName, color: initialColor });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (action === '/money/tags') form.post(action, { preserveScroll: true, onSuccess: onClose });
        else form.put(action, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <form className="space-y-6" onSubmit={submit}>
            <Field autoFocus error={form.errors.name} label="Name" maxLength={50} onChange={(event) => form.setData('name', event.target.value)} placeholder="Xbox" required value={form.data.name} />
            <div>
                <label className="text-sm font-semibold text-secondary" htmlFor="tag-color">Color</label>
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-border-strong bg-app p-3">
                    <input className="focus-ring size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0" id="tag-color" onChange={(event) => form.setData('color', event.target.value.toUpperCase())} type="color" value={form.data.color} />
                    <span className="font-mono text-sm font-bold">{form.data.color}</span>
                </div>
                {form.errors.color && <p className="mt-2 text-sm text-danger">{form.errors.color}</p>}
            </div>
            <Button disabled={form.processing || form.data.name.trim() === ''} fullWidth type="submit">{initialName ? <Save size={17} /> : <Plus size={17} />}{submitLabel}</Button>
        </form>
    );
}

export function TagCreateDrawer({ onClose }: { onClose: () => void }) {
    return <MoneyDrawer onClose={onClose} open title="New Tag"><TagForm action="/money/tags" initialColor={defaultColor} initialName="" onClose={onClose} submitLabel="Create Tag" /></MoneyDrawer>;
}

export function TagEditDrawer({ onClose, tag }: { onClose: () => void; tag: MoneyTagManagementData }) {
    return <MoneyDrawer onClose={onClose} open title="Edit Tag"><TagForm action={`/money/tags/${tag.id}`} initialColor={tag.color ?? defaultColor} initialName={tag.name} onClose={onClose} submitLabel="Save Tag" /></MoneyDrawer>;
}
