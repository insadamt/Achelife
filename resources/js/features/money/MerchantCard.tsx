import { router } from '@inertiajs/react';
import { Archive, MoreHorizontal, Pencil, RotateCcw, Store, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { MerchantRenameDrawer } from './MerchantEditorDrawers';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
import type { MoneyMerchantData } from './types';

type ConfirmationAction = 'archive' | 'delete' | null;

export function MerchantCard({ merchant }: { merchant: MoneyMerchantData }) {
    const [actionsOpen, setActionsOpen] = useState(false);
    const [renaming, setRenaming] = useState(false);
    const [confirmation, setConfirmation] = useState<ConfirmationAction>(null);
    const archived = merchant.archivedAt !== null;

    function archiveOrReactivate() {
        if (archived) {
            router.post(`/money/merchants/${merchant.id}/reactivate`, {}, { preserveScroll: true });
            setActionsOpen(false);
            return;
        }

        setActionsOpen(false);
        setConfirmation('archive');
    }

    function confirmAction() {
        if (confirmation === 'archive') {
            router.post(`/money/merchants/${merchant.id}/archive`, {}, { preserveScroll: true });
        } else if (confirmation === 'delete') {
            router.delete(`/money/merchants/${merchant.id}`, { preserveScroll: true });
        }

        setConfirmation(null);
    }

    return (
        <>
            <Surface className={archived ? 'p-5 opacity-75' : 'p-5'} elevated>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--money-accent)_12%,transparent)] text-accent-ink"><Store aria-hidden="true" size={20} /></span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-lg font-bold">{merchant.name}</h2>
                                {archived && <StatusChip>Archived</StatusChip>}
                            </div>
                            <p className="mt-1 text-sm text-muted">{merchant.hasHistory ? 'Used in transaction history' : 'No transactions yet'}</p>
                        </div>
                    </div>
                    <Button aria-label={`Manage ${merchant.name}`} className="size-10 shrink-0 px-0" onClick={() => setActionsOpen(true)} size="small" variant="ghost"><MoreHorizontal aria-hidden="true" size={19} /></Button>
                </div>
            </Surface>

            <MoneyDrawer onClose={() => setActionsOpen(false)} open={actionsOpen} title="Merchant actions">
                <div className="space-y-3">
                    <Button fullWidth onClick={() => { setActionsOpen(false); setRenaming(true); }} variant="secondary"><Pencil aria-hidden="true" size={16} />Rename</Button>
                    <Button fullWidth onClick={archiveOrReactivate} variant="ghost">
                        {archived ? <RotateCcw aria-hidden="true" size={16} /> : <Archive aria-hidden="true" size={16} />}
                        {archived ? 'Reactivate' : 'Archive'}
                    </Button>
                    {!merchant.hasHistory && <Button fullWidth onClick={() => { setActionsOpen(false); setConfirmation('delete'); }} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete permanently</Button>}
                </div>
                {merchant.hasHistory && <p className="mt-5 rounded-2xl border border-border-subtle bg-app px-4 py-3 text-sm text-muted">This Merchant has transaction history, so it can be archived but not deleted.</p>}
            </MoneyDrawer>

            {renaming && <MerchantRenameDrawer merchant={merchant} onClose={() => setRenaming(false)} />}
            <MoneyConfirmationDialog
                confirmLabel={confirmation === 'delete' ? 'Delete permanently' : 'Archive Merchant'}
                destructive={confirmation === 'delete'}
                description={confirmation === 'delete'
                    ? `The unused Merchant ${merchant.name} will be permanently removed.`
                    : `${merchant.name} will no longer be suggested for new transactions. Existing history stays unchanged.`}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmAction}
                open={confirmation !== null}
                title={confirmation === 'delete' ? `Delete ${merchant.name}?` : `Archive ${merchant.name}?`}
            />
        </>
    );
}
