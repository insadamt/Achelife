import { router } from '@inertiajs/react';
import { Archive, MoreHorizontal, Pencil, RotateCcw, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
import { TagEditDrawer } from './TagEditorDrawers';
import type { MoneyTagManagementData } from './types';

export function TagCard({ tag }: { tag: MoneyTagManagementData }) {
    const [actionsOpen, setActionsOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [confirmation, setConfirmation] = useState<'archive' | 'delete' | null>(null);
    const archived = tag.archivedAt !== null;

    function archiveOrReactivate() {
        if (archived) router.post(`/money/tags/${tag.id}/reactivate`, {}, { preserveScroll: true });
        else setConfirmation('archive');
        setActionsOpen(false);
    }

    function confirmAction() {
        if (confirmation === 'archive') router.post(`/money/tags/${tag.id}/archive`, {}, { preserveScroll: true });
        if (confirmation === 'delete') router.delete(`/money/tags/${tag.id}`, { preserveScroll: true });
        setConfirmation(null);
    }

    return (
        <>
            <Surface className={archived ? 'p-5 opacity-75' : 'p-5'} elevated>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${tag.color ?? '#64748B'}20`, color: tag.color ?? '#64748B' }}><Tag size={20} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-bold">{tag.name}</h2>{archived && <StatusChip>Archived</StatusChip>}</div><p className="mt-1 text-sm text-muted">{tag.hasHistory ? 'Used in transaction history' : 'No transactions yet'}</p></div></div>
                    <Button aria-label={`Manage ${tag.name}`} className="size-10 shrink-0 px-0" onClick={() => setActionsOpen(true)} size="small" variant="ghost"><MoreHorizontal size={19} /></Button>
                </div>
            </Surface>
            <MoneyDrawer onClose={() => setActionsOpen(false)} open={actionsOpen} title="Tag actions"><div className="space-y-3"><Button fullWidth onClick={() => { setActionsOpen(false); setEditing(true); }} variant="secondary"><Pencil size={16} />Edit name and color</Button><Button fullWidth onClick={archiveOrReactivate} variant="ghost">{archived ? <RotateCcw size={16} /> : <Archive size={16} />}{archived ? 'Reactivate' : 'Archive'}</Button>{!tag.hasHistory && <Button fullWidth onClick={() => { setActionsOpen(false); setConfirmation('delete'); }} variant="destructive"><Trash2 size={16} />Delete permanently</Button>}</div>{tag.hasHistory && <p className="mt-5 rounded-2xl border border-border-subtle bg-app px-4 py-3 text-sm text-muted">This Tag has transaction history, so it can be archived but not deleted.</p>}</MoneyDrawer>
            {editing && <TagEditDrawer onClose={() => setEditing(false)} tag={tag} />}
            <MoneyConfirmationDialog confirmLabel={confirmation === 'delete' ? 'Delete permanently' : 'Archive Tag'} destructive={confirmation === 'delete'} description={confirmation === 'delete' ? `The unused Tag ${tag.name} will be permanently removed.` : `${tag.name} will no longer be suggested for new transactions. Existing history stays unchanged.`} onClose={() => setConfirmation(null)} onConfirm={confirmAction} open={confirmation !== null} title={confirmation === 'delete' ? `Delete ${tag.name}?` : `Archive ${tag.name}?`} />
        </>
    );
}
