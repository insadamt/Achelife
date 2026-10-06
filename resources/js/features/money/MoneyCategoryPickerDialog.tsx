import { ChevronLeft, Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Dialog, DialogDismissButton } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { MoneyCategoryIcon } from './MoneyCategoryIcon';
import type { MoneyCategoryData, MoneySubcategoryData } from './types';

export function MoneyCategoryPickerDialog({
    categories,
    onClose,
    onSelect,
    open,
    selectedCategoryId,
    selectedSubcategoryId,
}: {
    categories: MoneyCategoryData[];
    onClose: () => void;
    onSelect: (categoryId: number, subcategoryId: number | '') => void;
    open: boolean;
    selectedCategoryId: number | '';
    selectedSubcategoryId: number | '';
}) {
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
    const [query, setQuery] = useState('');
    const availableCategories = useMemo(() => categories.map((category) => ({
        ...category,
        subcategories: category.subcategories.filter((subcategory) => subcategory.archivedAt === null
            || (category.id === selectedCategoryId && subcategory.id === selectedSubcategoryId)),
    })), [categories, selectedCategoryId, selectedSubcategoryId]);
    const activeCategory = availableCategories.find((category) => category.id === activeCategoryId) ?? null;
    const visibleSubcategories = useMemo(() => {
        if (!activeCategory) return [];
        const normalizedQuery = query.trim().toLowerCase();
        return activeCategory.subcategories.filter((subcategory) => !normalizedQuery || subcategory.name.toLowerCase().includes(normalizedQuery));
    }, [activeCategory, query]);

    const searchResults = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        if (!normalizedQuery) return [];
        const results: Array<{ category: MoneyCategoryData; subcategory: MoneySubcategoryData | null }> = [];
        for (const category of availableCategories) {
            const parentMatches = category.name.toLocaleLowerCase().includes(normalizedQuery);
            if (parentMatches) results.push({ category, subcategory: null });
            for (const subcategory of category.subcategories) {
                if (parentMatches || subcategory.name.toLocaleLowerCase().includes(normalizedQuery)) {
                    results.push({ category, subcategory });
                }
            }
        }
        return results;
    }, [availableCategories, query]);

    function chooseCategory(category: MoneyCategoryData) {
        if (category.subcategories.length === 0) {
            onSelect(category.id, '');
            return;
        }
        setActiveCategoryId(category.id);
        setQuery('');
    }

    return (
        <Dialog
            description={activeCategory ? 'Choose a more specific label, or keep the parent Category.' : 'Search Categories and Subcategories, or browse the available Categories.'}
            onClose={onClose}
            open={open}
            title={activeCategory?.name ?? 'Choose Category'}
        >
            {activeCategory && (
                <button className="focus-ring mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-muted hover:text-foreground" onClick={() => { setActiveCategoryId(null); setQuery(''); }} type="button">
                    <ChevronLeft aria-hidden="true" size={17} />All Categories
                </button>
            )}
            <label className="relative block">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" size={17} />
                <span className="sr-only">Search {activeCategory ? 'Subcategories' : 'Categories and Subcategories'}</span>
                <input
                    autoFocus
                    className="focus-ring min-h-12 w-full rounded-2xl border border-border-strong bg-app pr-4 pl-11 text-sm text-foreground placeholder:text-muted"
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }}
                    placeholder={activeCategory ? 'Search Subcategories' : 'Search Categories or Subcategories'}
                    value={query}
                />
            </label>

            {!activeCategory && query.trim() ? (
                <div className="mt-4 grid max-h-[min(60vh,28rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {searchResults.map(({ category, subcategory }) => {
                        const selected = selectedCategoryId === category.id && selectedSubcategoryId === (subcategory?.id ?? '');
                        return (
                            <button aria-pressed={selected} className={classNames('focus-ring flex min-h-20 items-center gap-3 rounded-2xl border bg-app p-3 text-left hover:bg-surface-hover', selected ? 'border-[var(--money-accent)]' : 'border-border-subtle')} key={`${category.id}-${subcategory?.id ?? 'parent'}`} onClick={() => onSelect(category.id, subcategory?.id ?? '')} type="button">
                                <MoneyCategoryIcon className="size-10" color={category.color} name={category.name} presetKey={category.presetKey} />
                                <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold">{subcategory?.name ?? category.name}</span><span className="mt-0.5 block break-words text-xs text-muted">{subcategory ? category.name : 'No Subcategory'}</span></span>
                                {selected && <Check aria-hidden="true" className="shrink-0" size={16} />}
                            </button>
                        );
                    })}
                </div>
            ) : activeCategory ? (
                <div className="mt-4 grid max-h-[min(60vh,28rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
                    <button
                        className={classNames('focus-ring col-span-2 flex min-h-14 items-center justify-between rounded-2xl border px-4 text-left text-sm font-bold', selectedCategoryId === activeCategory.id && selectedSubcategoryId === '' ? 'border-[var(--money-accent)] bg-[color-mix(in_srgb,var(--money-accent)_10%,transparent)]' : 'border-border-subtle bg-app hover:bg-surface-hover')}
                        onClick={() => onSelect(activeCategory.id, '')}
                        type="button"
                    >
                        No Subcategory
                        {selectedCategoryId === activeCategory.id && selectedSubcategoryId === '' && <Check aria-hidden="true" size={17} />}
                    </button>
                    {visibleSubcategories.map((subcategory) => (
                        <button
                            className={classNames('focus-ring flex min-h-16 items-center justify-between gap-2 rounded-2xl border bg-app px-3 text-left text-sm font-bold hover:bg-surface-hover', selectedSubcategoryId === subcategory.id ? 'border-[var(--money-accent)] text-accent-ink' : 'border-border-subtle')}
                            key={subcategory.id}
                            onClick={() => onSelect(activeCategory.id, subcategory.id)}
                            type="button"
                        >
                            <span className="truncate">{subcategory.name}</span>
                            {selectedSubcategoryId === subcategory.id && <Check aria-hidden="true" className="shrink-0" size={16} />}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="mt-4 grid max-h-[min(60vh,28rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
                    {availableCategories.map((category) => (
                        <button
                            className={classNames('focus-ring flex min-h-20 items-center gap-3 rounded-2xl border bg-app p-3 text-left hover:bg-surface-hover', selectedCategoryId === category.id ? 'border-[var(--money-accent)]' : 'border-border-subtle')}
                            key={category.id}
                            onClick={() => chooseCategory(category)}
                            type="button"
                        >
                            <MoneyCategoryIcon className="size-10" color={category.color} name={category.name} presetKey={category.presetKey} />
                            <span className="min-w-0"><span className="block truncate text-sm font-bold">{category.name}</span><span className="mt-0.5 block text-xs text-muted">{category.subcategories.length} {category.subcategories.length === 1 ? 'option' : 'options'}</span></span>
                        </button>
                    ))}
                </div>
            )}

            {((activeCategory && visibleSubcategories.length === 0) || (!activeCategory && (query.trim() ? searchResults.length === 0 : availableCategories.length === 0))) && (
                <p className="mt-6 rounded-2xl border border-dashed border-border-strong bg-inset p-5 text-center text-sm text-muted">No matching {activeCategory ? 'Subcategories' : 'Categories'}.</p>
            )}
            <DialogDismissButton className="mt-5" fullWidth variant="ghost">Cancel</DialogDismissButton>
        </Dialog>
    );
}
