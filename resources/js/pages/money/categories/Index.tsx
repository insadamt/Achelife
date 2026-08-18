import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';

import { Button, Drawer, Field, SelectField, Surface, StatusChip } from '../../../components/ui';
import type { MoneyCategoryData, MoneyCategoryType, MoneySubcategoryData } from '../../../features/money/types';

function CategoryEditor({ onClose }: { onClose: () => void }) {
    const form = useForm<{ name: string; type: MoneyCategoryType }>({ name: '', type: 'expense' });
    function submit(event: FormEvent) { event.preventDefault(); form.post('/money/categories', { preserveScroll: true, onSuccess: onClose }); }
    return <Drawer description="Categories are specific to Income or Expense." onClose={onClose} open title="New Category"><form className="space-y-6" onSubmit={submit}><Field error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} placeholder="Transport" required value={form.data.name} /><SelectField error={form.errors.type} label="Transaction type" onChange={(event) => form.setData('type', event.target.value as MoneyCategoryType)} options={[{ label: 'Expense', value: 'expense' }, { label: 'Income', value: 'income' }]} value={form.data.type} /><Button disabled={form.processing} fullWidth type="submit">Create Category</Button></form></Drawer>;
}

function SubcategoryEditor({ categories, initialCategoryId, onClose }: { categories: MoneyCategoryData[]; initialCategoryId?: number; onClose: () => void }) {
    const form = useForm<{ category_id: number | ''; name: string }>({ category_id: initialCategoryId ?? categories[0]?.id ?? '', name: '' });
    function submit(event: FormEvent) { event.preventDefault(); form.post('/money/subcategories', { preserveScroll: true, onSuccess: onClose }); }
    return <Drawer description="A Subcategory belongs to exactly one parent Category." onClose={onClose} open title="New Subcategory"><form className="space-y-6" onSubmit={submit}><SelectField error={form.errors.category_id} label="Parent Category" onChange={(event) => form.setData('category_id', Number(event.target.value))} options={categories.map((category) => ({ label: `${category.name} · ${category.type}`, value: String(category.id) }))} value={form.data.category_id} /><Field error={form.errors.name} label="Name" maxLength={120} onChange={(event) => form.setData('name', event.target.value)} placeholder="Groceries" required value={form.data.name} /><Button disabled={form.processing} fullWidth type="submit">Create Subcategory</Button></form></Drawer>;
}

function renameCategory(category: MoneyCategoryData) {
    const name = window.prompt('Category name', category.name)?.trim();
    if (name && name !== category.name) router.put(`/money/categories/${category.id}`, { name }, { preserveScroll: true });
}
function renameSubcategory(subcategory: MoneySubcategoryData) {
    const name = window.prompt('Subcategory name', subcategory.name)?.trim();
    if (name && name !== subcategory.name) router.put(`/money/subcategories/${subcategory.id}`, { name }, { preserveScroll: true });
}

function CategoryCard({ category, onAddSubcategory }: { category: MoneyCategoryData; onAddSubcategory: () => void }) {
    const archived = category.archivedAt !== null;
    function archiveOrReactivate() {
        if (archived) router.post(`/money/categories/${category.id}/reactivate`, {}, { preserveScroll: true });
        else if (window.confirm(`Archive ${category.name}? It will be unavailable for new transactions.`)) router.post(`/money/categories/${category.id}/archive`, {}, { preserveScroll: true });
    }
    function destroy() { if (window.confirm(`Delete unused Category ${category.name} permanently?`)) router.delete(`/money/categories/${category.id}`, { preserveScroll: true }); }

    return <Surface className={`p-5 ${archived ? 'opacity-80' : ''}`} elevated>
        <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold">{category.name}</h3>{category.builtIn && <StatusChip status="completed">Built in</StatusChip>}{archived && <StatusChip>Archived</StatusChip>}</div><p className="mt-1 text-xs font-bold tracking-[0.14em] text-muted uppercase">{category.type}</p></div><Button disabled={archived} onClick={onAddSubcategory} size="small" variant="secondary">+ Subcategory</Button></div>
        <div className="mt-5 space-y-2 border-l border-border-strong pl-4">{category.subcategories.length > 0 ? category.subcategories.map((subcategory) => <div className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-surface-hover" key={subcategory.id}><div><span className={subcategory.archivedAt ? 'text-muted line-through' : 'text-secondary'}>{subcategory.name}</span>{subcategory.archivedAt && <span className="ml-2 text-[0.625rem] font-bold text-muted uppercase">Archived</span>}</div><div className="flex flex-wrap justify-end gap-1"><Button onClick={() => renameSubcategory(subcategory)} size="small" variant="ghost">Rename</Button><Button onClick={() => router.post(`/money/subcategories/${subcategory.id}/${subcategory.archivedAt ? 'reactivate' : 'archive'}`, {}, { preserveScroll: true })} size="small" variant="ghost">{subcategory.archivedAt ? 'Reactivate' : 'Archive'}</Button>{!subcategory.hasHistory && <Button onClick={() => window.confirm(`Delete ${subcategory.name} permanently?`) && router.delete(`/money/subcategories/${subcategory.id}`, { preserveScroll: true })} size="small" variant="destructive">Delete</Button>}</div></div>) : <p className="py-2 text-sm text-muted">No Subcategories</p>}</div>
        <div className="mt-5 flex flex-wrap gap-1 border-t border-border-subtle pt-4">{!category.builtIn && <Button onClick={() => renameCategory(category)} size="small" variant="ghost">Rename</Button>}{!category.builtIn && <Button onClick={archiveOrReactivate} size="small" variant="ghost">{archived ? 'Reactivate' : 'Archive'}</Button>}{!category.builtIn && !category.hasHistory && <Button onClick={destroy} size="small" variant="destructive">Delete</Button>}</div>
    </Surface>;
}

export default function MoneyCategories({ categories }: { categories: MoneyCategoryData[] }) {
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [subcategoryParentId, setSubcategoryParentId] = useState<number | null>(null);
    const active = categories.filter((category) => category.archivedAt === null);
    const archived = categories.filter((category) => category.archivedAt !== null);

    return <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
        <Head title="Money Categories" /><Link className="text-sm font-bold text-muted hover:text-foreground" href="/money">← Back to Money</Link>
        <header className="mt-6 mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold tracking-[0.2em] text-[var(--money-accent)] uppercase">Wallet organization</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Categories</h1><p className="mt-2 text-sm text-secondary">A simple two-level hierarchy for Income and Expenses.</p></div><div className="flex gap-2"><Button onClick={() => setCreatingCategory(true)}>+ Category</Button><Button disabled={active.length === 0} onClick={() => setSubcategoryParentId(active[0]?.id ?? null)} variant="secondary">+ Subcategory</Button></div></header>
        <section><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Active Categories</h2><span className="text-xs text-muted">{active.length}</span></div><div className="grid gap-4 xl:grid-cols-2">{active.map((category) => <CategoryCard category={category} key={category.id} onAddSubcategory={() => setSubcategoryParentId(category.id)} />)}</div></section>
        <section className="mt-10"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold tracking-[0.17em] text-secondary uppercase">Archived Categories</h2><span className="text-xs text-muted">{archived.length}</span></div>{archived.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{archived.map((category) => <CategoryCard category={category} key={category.id} onAddSubcategory={() => undefined} />)}</div> : <Surface className="p-8 text-center text-secondary">No Archived Categories.</Surface>}</section>
        {creatingCategory && <CategoryEditor onClose={() => setCreatingCategory(false)} />}{subcategoryParentId !== null && <SubcategoryEditor categories={active} initialCategoryId={subcategoryParentId} onClose={() => setSubcategoryParentId(null)} />}
    </div>;
}
