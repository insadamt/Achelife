import { router } from '@inertiajs/react';
import { Archive, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, StatusChip, Surface } from '../../components/ui';
import { CategoryRenameDrawer } from './CategoryEditorDrawers';
import { MoneyConfirmationDialog } from './MoneyConfirmationDialog';
import { MoneyDrawer } from './MoneyDrawer';
import type { MoneyCategoryData, MoneySubcategoryData } from './types';

type CategoryTarget =
    | { kind: 'category'; item: MoneyCategoryData }
    | { kind: 'subcategory'; item: MoneySubcategoryData };
type ConfirmationAction = 'archive' | 'delete';

export function CategoryCard({ category, onAddSubcategory }: { category: MoneyCategoryData; onAddSubcategory: () => void }) {
    const [actionTarget, setActionTarget] = useState<CategoryTarget | null>(null);
    const [renameTarget, setRenameTarget] = useState<CategoryTarget | null>(null);
    const [confirmation, setConfirmation] = useState<{ action: ConfirmationAction; target: CategoryTarget } | null>(null);
    const archived = category.archivedAt !== null;

    function routeFor(target: CategoryTarget, action: 'archive' | 'reactivate'): string {
        const resource = target.kind === 'category' ? 'categories' : 'subcategories';
        return `/money/${resource}/${target.item.id}/${action}`;
    }

    function editName() {
        if (!actionTarget) return;
        setRenameTarget(actionTarget);
        setActionTarget(null);
    }

    function archiveOrReactivate() {
        if (!actionTarget) return;
        const isArchived = actionTarget.item.archivedAt !== null;

        if (isArchived) {
            router.post(routeFor(actionTarget, 'reactivate'), {}, { preserveScroll: true });
            setActionTarget(null);
            return;
        }

        setConfirmation({ action: 'archive', target: actionTarget });
        setActionTarget(null);
    }

    function confirmAction() {
        if (!confirmation) return;
        const { action, target } = confirmation;

        if (action === 'archive') {
            router.post(routeFor(target, 'archive'), {}, { preserveScroll: true });
        } else {
            const resource = target.kind === 'category' ? 'categories' : 'subcategories';
            router.delete(`/money/${resource}/${target.item.id}`, { preserveScroll: true });
        }

        setConfirmation(null);
    }

    function requestDelete() {
        if (!actionTarget) return;
        setConfirmation({ action: 'delete', target: actionTarget });
        setActionTarget(null);
    }

    return (
        <>
            <Surface className={archived ? 'p-5 opacity-75' : 'p-5'} elevated>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-bold">{category.name}</h3>
                            {category.builtIn && <StatusChip status="completed">Built in</StatusChip>}
                            {archived && <StatusChip>Archived</StatusChip>}
                        </div>
                    </div>
                    {!category.builtIn && (
                        <Button aria-label={`Manage ${category.name}`} className="size-10 px-0" onClick={() => setActionTarget({ kind: 'category', item: category })} size="small" variant="ghost">
                            <MoreHorizontal aria-hidden="true" size={19} />
                        </Button>
                    )}
                </div>

                <div className="mt-5 divide-y divide-border-subtle border-y border-border-subtle">
                    {category.subcategories.length > 0 ? category.subcategories.map((subcategory) => (
                        <div className="flex min-h-12 items-center justify-between gap-3 py-2 pl-3" key={subcategory.id}>
                            <div className="min-w-0">
                                <span className={subcategory.archivedAt ? 'truncate text-muted line-through' : 'truncate text-secondary'}>{subcategory.name}</span>
                                {subcategory.archivedAt && <span className="ml-2 text-[0.625rem] font-bold text-muted uppercase">Archived</span>}
                            </div>
                            <Button aria-label={`Manage ${subcategory.name}`} className="size-10 shrink-0 px-0" onClick={() => setActionTarget({ kind: 'subcategory', item: subcategory })} size="small" variant="ghost">
                                <MoreHorizontal aria-hidden="true" size={18} />
                            </Button>
                        </div>
                    )) : <p className="py-5 text-center text-sm text-muted">No Subcategories yet</p>}
                </div>

                {!archived && (
                    <Button className="mt-4" onClick={onAddSubcategory} size="small" variant="ghost">
                        <Plus aria-hidden="true" size={15} /> Add Subcategory
                    </Button>
                )}
            </Surface>

            {actionTarget && (
                <MoneyDrawer onClose={() => setActionTarget(null)} open title={`${actionTarget.kind === 'category' ? 'Category' : 'Subcategory'} actions`}>
                    <div className="space-y-3">
                        <Button fullWidth onClick={editName} variant="secondary"><Pencil aria-hidden="true" size={16} />Rename</Button>
                        <Button fullWidth onClick={archiveOrReactivate} variant="ghost">
                            {actionTarget.item.archivedAt ? <RotateCcw aria-hidden="true" size={16} /> : <Archive aria-hidden="true" size={16} />}
                            {actionTarget.item.archivedAt ? 'Reactivate' : 'Archive'}
                        </Button>
                        {!actionTarget.item.hasHistory && <Button fullWidth onClick={requestDelete} variant="destructive"><Trash2 aria-hidden="true" size={16} />Delete permanently</Button>}
                    </div>
                    {actionTarget.item.hasHistory && <p className="mt-5 rounded-2xl border border-border-subtle bg-app px-4 py-3 text-sm text-muted">This item has financial history, so it can be archived but not deleted.</p>}
                </MoneyDrawer>
            )}

            {renameTarget && <CategoryRenameDrawer item={renameTarget.item} kind={renameTarget.kind} onClose={() => setRenameTarget(null)} />}

            <MoneyConfirmationDialog
                confirmLabel={confirmation?.action === 'delete' ? 'Delete permanently' : 'Archive'}
                destructive={confirmation?.action === 'delete'}
                description={confirmation?.action === 'delete'
                    ? `The unused ${confirmation.target.kind} ${confirmation.target.item.name} will be permanently removed.`
                    : `${confirmation?.target.item.name} will no longer be available for new transactions. Existing history stays unchanged.`}
                onClose={() => setConfirmation(null)}
                onConfirm={confirmAction}
                open={confirmation !== null}
                title={confirmation ? `${confirmation.action === 'delete' ? 'Delete' : 'Archive'} ${confirmation.target.item.name}?` : 'Confirm action'}
            />
        </>
    );
}
