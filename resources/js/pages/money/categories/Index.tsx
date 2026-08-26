import { Head } from '@inertiajs/react';
import { Archive, ArrowDownLeft, ArrowUpRight, PackageOpen, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Field, Surface } from '../../../components/ui';
import { CategoryCard } from '../../../features/money/CategoryCard';
import { CategoryCreateDrawer, SubcategoryCreateDrawer } from '../../../features/money/CategoryEditorDrawers';
import { MoneySectionNav } from '../../../features/money/MoneySectionNav';
import { MoneyPresetPackDrawer } from '../../../features/money/MoneyPresetPackDrawer';
import type { MoneyPresetPackData } from '../../../features/money/MoneyPresetPackDrawer';
import type { MoneyCategoryData, MoneyCategoryType } from '../../../features/money/types';

type CategoryTab = MoneyCategoryType | 'archived';

export default function MoneyCategories({ categories, presetPack }: { categories: MoneyCategoryData[]; presetPack: MoneyPresetPackData }) {
    const [activeTab, setActiveTab] = useState<CategoryTab>('expense');
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [subcategoryParentId, setSubcategoryParentId] = useState<number | null>(null);
    const [presetPreviewOpen, setPresetPreviewOpen] = useState(false);
    const [search, setSearch] = useState('');
    const activeCategories = categories.filter((category) => category.archivedAt === null);
    const tabCategories = activeTab === 'archived'
        ? categories.filter((category) => category.archivedAt !== null)
        : activeCategories.filter((category) => category.type === activeTab);
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const visibleCategories = tabCategories.filter((category) => normalizedSearch === ''
        || category.name.toLocaleLowerCase().includes(normalizedSearch)
        || category.subcategories.some((subcategory) => subcategory.name.toLocaleLowerCase().includes(normalizedSearch)));
    const tabs: Array<{ icon: typeof ArrowUpRight; label: string; value: CategoryTab; count: number }> = [
        { icon: ArrowUpRight, label: 'Expenses', value: 'expense', count: activeCategories.filter((category) => category.type === 'expense').length },
        { icon: ArrowDownLeft, label: 'Income', value: 'income', count: activeCategories.filter((category) => category.type === 'income').length },
        { icon: Archive, label: 'Archived', value: 'archived', count: categories.filter((category) => category.archivedAt !== null).length },
    ];

    return (
        <div style={{ '--module-accent': 'var(--money-accent)' } as CSSProperties}>
            <Head title="Money Categories" />
            <header className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Categories</h1>
                </div>
                <MoneySectionNav active="categories" />
            </header>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div aria-label="Category views" className="flex max-w-full overflow-x-auto rounded-full border border-border-subtle bg-surface p-1" role="tablist">
                    {tabs.map((tab) => {
                        const TabIcon = tab.icon;

                        return (
                            <button
                                aria-selected={activeTab === tab.value}
                                className={activeTab === tab.value
                                    ? 'focus-ring icon-text flex shrink-0 items-center gap-1.5 rounded-full bg-elevated px-4 py-2 text-sm font-bold text-foreground shadow-sm'
                                    : 'focus-ring icon-text flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted hover:text-foreground'}
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                role="tab"
                                type="button"
                            >
                                <TabIcon aria-hidden="true" size={14} />
                                {tab.label} <span className="text-xs text-muted">{tab.count}</span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setPresetPreviewOpen(true)} variant="secondary"><PackageOpen aria-hidden="true" size={17} />Presets</Button>
                    <Button onClick={() => setCreatingCategory(true)}><Plus aria-hidden="true" size={17} /> Category</Button>
                </div>
            </div>

            <div className="relative mb-5 max-w-xl">
                <Search aria-hidden="true" className="pointer-events-none absolute top-[2.8rem] left-4 text-muted" size={18} />
                <Field className="pl-11" label="Search Categories and Subcategories" onChange={(event) => setSearch(event.target.value)} placeholder="Try Bank Fees or Transport" value={search} />
            </div>

            {visibleCategories.length > 0 ? (
                <div className="grid gap-4 xl:grid-cols-2">
                    {visibleCategories.map((category) => (
                        <CategoryCard category={category} key={category.id} onAddSubcategory={() => setSubcategoryParentId(category.id)} />
                    ))}
                </div>
            ) : (
                <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated>
                    <div>
                        <p className="text-2xl font-bold">{search ? 'No matching Categories' : `No ${activeTab === 'archived' ? 'Archived' : activeTab === 'expense' ? 'Expense' : 'Income'} Categories`}</p>
                        {activeTab !== 'archived' && <Button className="mt-5" onClick={() => setCreatingCategory(true)}><Plus aria-hidden="true" size={17} />Create Category</Button>}
                    </div>
                </Surface>
            )}

            {creatingCategory && <CategoryCreateDrawer onClose={() => setCreatingCategory(false)} />}
            {presetPreviewOpen && <MoneyPresetPackDrawer onClose={() => setPresetPreviewOpen(false)} pack={presetPack} />}
            {subcategoryParentId !== null && (
                <SubcategoryCreateDrawer categories={activeCategories} initialCategoryId={subcategoryParentId} onClose={() => setSubcategoryParentId(null)} />
            )}
        </div>
    );
}
