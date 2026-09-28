import { Archive, Plus, Search, Tags } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button, Field, Surface } from '../../components/ui';
import { SlidingNavigationIndicator } from '../../components/ui/SlidingNavigationIndicator';
import { useHorizontalTabTransition } from '../../components/ui/useHorizontalTabTransition';
import { TagCard } from './TagCard';
import { TagCreateDrawer } from './TagEditorDrawers';
import type { MoneyTagManagementData } from './types';

const tagTabs = ['active', 'archived'] as const;

export function TagManager({ tags }: { tags: MoneyTagManagementData[] }) {
    const tabNavigationRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const { panelRef, selectTab, shellRef } = useHorizontalTabTransition(activeTab, tagTabs, setActiveTab);
    const activeCount = tags.filter((tag) => tag.archivedAt === null).length;
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const visibleTags = tags.filter((tag) =>
        (activeTab === 'active' ? tag.archivedAt === null : tag.archivedAt !== null)
        && (normalizedSearch === '' || tag.name.toLocaleLowerCase().includes(normalizedSearch)),
    );

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div aria-label="Tag views" className="relative flex rounded-full border border-border-subtle bg-surface p-1" ref={tabNavigationRef} role="tablist">
                    <SlidingNavigationIndicator active={activeTab} className="rounded-full" containerRef={tabNavigationRef} group="money-tag-views" />
                    {tagTabs.map((tab) => {
                        const selected = activeTab === tab;
                        const Icon = tab === 'active' ? Tags : Archive;

                        return (
                            <button
                                aria-selected={selected}
                                className={selected
                                    ? 'focus-ring icon-text relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-foreground'
                                    : 'focus-ring icon-text relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-secondary hover:bg-surface-hover hover:text-foreground'}
                                data-nav-value={tab}
                                key={tab}
                                onClick={() => selectTab(tab)}
                                role="tab"
                                type="button"
                            >
                                <Icon aria-hidden="true" size={14} />
                                {tab === 'active' ? 'Active' : 'Archived'}
                                <span className="text-xs text-muted">{tab === 'active' ? activeCount : tags.length - activeCount}</span>
                            </button>
                        );
                    })}
                </div>
                <Button onClick={() => setCreating(true)}><Plus size={17} />Tag</Button>
            </div>
            <div className="relative" ref={shellRef}>
                <div ref={panelRef}>
                    <div className="relative mb-5 max-w-xl">
                        <Search className="pointer-events-none absolute top-[2.8rem] left-4 text-muted" size={18} />
                        <Field className="pl-11" label="Search Tags" onChange={(event) => setSearch(event.target.value)} placeholder="Try Xbox or Retro" value={search} />
                    </div>
                    {visibleTags.length > 0 ? (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {visibleTags.map((tag) => <TagCard key={tag.id} tag={tag} />)}
                        </div>
                    ) : (
                        <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated>
                            <div>
                                <p className="text-2xl font-bold">{search ? 'No matching Tags' : `No ${activeTab} Tags`}</p>
                                {activeTab === 'active' && <Button className="mt-5" onClick={() => setCreating(true)}><Plus size={17} />Create Tag</Button>}
                            </div>
                        </Surface>
                    )}
                </div>
            </div>
            {creating && <TagCreateDrawer onClose={() => setCreating(false)} />}
        </>
    );
}
