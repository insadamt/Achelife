import { Head } from '@inertiajs/react';
import { Archive, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { useState } from 'react';
import type { CSSProperties } from 'react';

import { Button, Surface } from '../../../components/ui';
import { CategoryCard } from '../../../features/money/CategoryCard';
import { CategoryCreateDrawer, SubcategoryCreateDrawer } from '../../../features/money/CategoryEditorDrawers';
import { MoneySectionNav } from '../../../features/money/MoneySectionNav';
import type { MoneyCategoryData, MoneyCategoryType } from '../../../features/money/types';

type CategoryTab = MoneyCategoryType | 'archived';

export default function MoneyCategories({ categories }: { categories: MoneyCategoryData[] }) {
    const [activeTab, setActiveTab] = useState<CategoryTab>('expense');
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [subcategoryParentId, setSubcategoryParentId] = useState<number | null>(null);
    const activeCategories = categories.filter((category) => category.archivedAt === null);
    const visibleCategories = activeTab === 'archived'
        ? categories.filter((category) => category.archivedAt !== null)
        : activeCategories.filter((category) => category.type === activeTab);
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
                <Button onClick={() => setCreatingCategory(true)}>
                    <Plus aria-hidden="true" size={17} /> Category
                </Button>
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
                        <p className="text-2xl font-bold">No {activeTab === 'archived' ? 'Archived' : activeTab === 'expense' ? 'Expense' : 'Income'} Categories</p>
                        {activeTab !== 'archived' && <Button className="mt-5" onClick={() => setCreatingCategory(true)}><Plus aria-hidden="true" size={17} />Create Category</Button>}
                    </div>
                </Surface>
            )}

            {creatingCategory && <CategoryCreateDrawer onClose={() => setCreatingCategory(false)} />}
            {subcategoryParentId !== null && (
                <SubcategoryCreateDrawer categories={activeCategories} initialCategoryId={subcategoryParentId} onClose={() => setSubcategoryParentId(null)} />
            )}
        </div>
    );
}
