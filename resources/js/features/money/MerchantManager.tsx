import { Archive, Plus, Search, Store } from 'lucide-react';
import { useState } from 'react';

import { Button, Field, Surface } from '../../components/ui';
import { MerchantCard } from './MerchantCard';
import { MerchantCreateDrawer } from './MerchantEditorDrawers';
import type { MoneyMerchantData } from './types';

export function MerchantManager({ merchants }: { merchants: MoneyMerchantData[] }) {
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const visible = merchants.filter((merchant) => (activeTab === 'active' ? merchant.archivedAt === null : merchant.archivedAt !== null) && (normalizedSearch === '' || merchant.name.toLocaleLowerCase().includes(normalizedSearch)));
    const activeCount = merchants.filter((merchant) => merchant.archivedAt === null).length;

    return (
        <>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex rounded-full border border-border-subtle bg-surface p-1" role="tablist">
                    <button aria-selected={activeTab === 'active'} className={activeTab === 'active' ? 'focus-ring icon-text flex items-center gap-1.5 rounded-full bg-elevated px-4 py-2 text-sm font-bold shadow-sm' : 'focus-ring icon-text flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted'} onClick={() => setActiveTab('active')} role="tab" type="button"><Store size={14} />Active <span className="text-xs text-muted">{activeCount}</span></button>
                    <button aria-selected={activeTab === 'archived'} className={activeTab === 'archived' ? 'focus-ring icon-text flex items-center gap-1.5 rounded-full bg-elevated px-4 py-2 text-sm font-bold shadow-sm' : 'focus-ring icon-text flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-muted'} onClick={() => setActiveTab('archived')} role="tab" type="button"><Archive size={14} />Archived <span className="text-xs text-muted">{merchants.length - activeCount}</span></button>
                </div>
                <Button onClick={() => setCreating(true)}><Plus size={17} />Merchant</Button>
            </div>
            <div className="relative mb-5 max-w-xl"><Search className="pointer-events-none absolute top-[2.8rem] left-4 text-muted" size={18} /><Field className="pl-11" label="Search Merchants" onChange={(event) => setSearch(event.target.value)} placeholder="Try Steam" value={search} /></div>
            {visible.length > 0 ? <div className="grid gap-4 xl:grid-cols-2">{visible.map((merchant) => <MerchantCard key={merchant.id} merchant={merchant} />)}</div> : <Surface className="grid min-h-56 place-items-center p-7 text-center" elevated><div><p className="text-2xl font-bold">{search ? 'No matching Merchants' : `No ${activeTab} Merchants`}</p>{activeTab === 'active' && <Button className="mt-5" onClick={() => setCreating(true)}><Plus size={17} />Create Merchant</Button>}</div></Surface>}
            {creating && <MerchantCreateDrawer onClose={() => setCreating(false)} />}
        </>
    );
}
