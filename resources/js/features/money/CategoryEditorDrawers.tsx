import { useForm } from '@inertiajs/react';
import { Plus, Save } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field, SelectField } from '../../components/ui';
import { MoneyDrawer } from './MoneyDrawer';
import type { MoneyCategoryData, MoneyCategoryType, MoneySubcategoryData } from './types';

export function CategoryCreateDrawer({ onClose }: { onClose: () => void }) {
    const form = useForm<{ name: string; type: MoneyCategoryType; color: string }>({ name: '', type: 'expense', color: '#2563EB' });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/money/categories', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title="New Category">
            <form className="space-y-6" onSubmit={submit}>
                <Field error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} placeholder="Transport" required value={form.data.name} />
                <SelectField error={form.errors.type} label="Transaction type" onChange={(event) => form.setData('type', event.target.value as MoneyCategoryType)} options={[{ label: 'Expense', value: 'expense' }, { label: 'Income', value: 'income' }]} value={form.data.type} />
                <ColorField color={form.data.color} error={form.errors.color} id="new-money-category-color" onChange={(color) => form.setData('color', color)} />
                <Button disabled={form.processing} fullWidth type="submit"><Plus aria-hidden="true" size={17} />Create Category</Button>
            </form>
        </MoneyDrawer>
    );
}

export function SubcategoryCreateDrawer({
    categories,
    initialCategoryId,
    onClose,
}: {
    categories: MoneyCategoryData[];
    initialCategoryId?: number;
    onClose: () => void;
}) {
    const form = useForm<{ category_id: number | ''; name: string }>({
        category_id: initialCategoryId ?? categories[0]?.id ?? '',
        name: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/money/subcategories', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title="New Subcategory">
            <form className="space-y-6" onSubmit={submit}>
                <SelectField error={form.errors.category_id} label="Parent Category" onChange={(event) => form.setData('category_id', Number(event.target.value))} options={categories.map((category) => ({ label: `${category.name} · ${category.type}`, value: String(category.id) }))} value={form.data.category_id} />
                <Field error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} placeholder="Groceries" required value={form.data.name} />
                <Button disabled={form.processing} fullWidth type="submit"><Plus aria-hidden="true" size={17} />Create Subcategory</Button>
            </form>
        </MoneyDrawer>
    );
}

export function CategoryRenameDrawer({
    item,
    kind,
    onClose,
}: {
    item: MoneyCategoryData | MoneySubcategoryData;
    kind: 'category' | 'subcategory';
    onClose: () => void;
}) {
    const categoryColor = kind === 'category' ? (item as MoneyCategoryData).color ?? '#2563EB' : null;
    const form = useForm<{ name: string; color?: string }>({ name: item.name, ...(categoryColor ? { color: categoryColor } : {}) });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/money/${kind === 'category' ? 'categories' : 'subcategories'}/${item.id}`, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <MoneyDrawer onClose={onClose} open title={kind === 'category' ? 'Edit Category' : 'Rename subcategory'}>
            <form className="space-y-6" onSubmit={submit}>
                <Field autoFocus error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} required value={form.data.name} />
                {kind === 'category' && <ColorField color={form.data.color ?? '#2563EB'} error={form.errors.color} id={`money-category-${item.id}-color`} onChange={(color) => form.setData('color', color)} />}
                <Button disabled={form.processing || form.data.name.trim() === item.name} fullWidth type="submit"><Save aria-hidden="true" size={17} />Save name</Button>
            </form>
        </MoneyDrawer>
    );
}

function ColorField({ color, error, id, onChange }: { color: string; error?: string; id: string; onChange: (color: string) => void }) {
    return <div><label className="text-sm font-semibold text-secondary" htmlFor={id}>Color</label><div className="mt-2 flex items-center gap-3 rounded-2xl border border-border-strong bg-app p-3"><input className="focus-ring size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0" id={id} onChange={(event) => onChange(event.target.value.toUpperCase())} type="color" value={color} /><span className="font-mono text-sm font-bold">{color}</span></div>{error && <p className="mt-2 text-sm text-danger">{error}</p>}</div>;
}
