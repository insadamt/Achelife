import { Archive, Plus, Search, Tags } from 'lucide-react';
import { useState } from 'react';

import { Button, Field, Surface } from '../../components/ui';
import { TagCard } from './TagCard';
import { TagCreateDrawer } from './TagEditorDrawers';
import type { MoneyTagManagementData } from './types';

export function TagManager({ tags }: { tags: MoneyTagManagementData[] }) {
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const activeCount = tags.filter((tag) => tag.archivedAt === null).length;
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const visible = tags.filter((tag) => (activeTab === 'active' ? tag.archivedAt === null : tag.archivedAt !== null) && (normalizedSearch === '' || tag.name.toLocaleLowerCase().includes(normalizedSearch)));

    return <>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex rounded-full border border-border-subtle bg-surface p-1" role="tablist"><button aria-selected={activeTab === 'active'} className={activeTab === 'active' ? 'focus-ring icon-text flex items-center gap-1.5 rounded-full bg-elevated px-4 py-2 text-sm font-bold shadow-sm' : 'focus-ring icon-text flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted'} onClick={() => setActiveTab('active')} role="tab" type="button"><Tags size={14} />Active <span className="text-xs text-muted">{activeCount}</span></button><button aria-selected={activeTab === 'archived'} className={activeTab === 'archived' ? 'focus-ring icon-text flex items-center gap-1.5 rounded-full bg-elevated px-4 py-2 text-sm font-bold shadow-sm' : 'focus-ring icon-text flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted'} onClick={() => setActiveTab('archived')} role="tab" type="button"><Archive size={14} />Archived <span className="text-xs text-muted">{tags.length - activeCount}</span></button></div><Button onClick={() => setCreating(true)}><Plus size={17} />Tag</Button></div>
        <div className="relative mb-5 max-w-xl"><Search className="pointer-events-none absolute top-[2.8rem] left-4 text-muted" size={18} /><Field className="pl-11" label="Search Tags" onChange={(event) => setSearch(event.target.value)} placeholder="Try Xbox or Retro" value={search} /></div>
        {visible.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{visible.map((tag) => <TagCard key={tag.id} tag={tag} />)}</div> : <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated><div><p className="text-2xl font-bold">{search ? 'No matching Tags' : `No ${activeTab} Tags`}</p>{activeTab === 'active' && <Button className="mt-5" onClick={() => setCreating(true)}><Plus size={17} />Create Tag</Button>}</div></Surface>}
        {creating && <TagCreateDrawer onClose={() => setCreating(false)} />}
    </>;
}
