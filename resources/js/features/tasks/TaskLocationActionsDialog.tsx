import { router, useForm } from '@inertiajs/react';
import { Archive, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button, Dialog, Field } from '../../components/ui';

type LocationKind = 'folder' | 'project';
type DialogMode = 'actions' | 'edit' | 'archive' | 'delete';

export interface TaskLocationActionTarget {
    id: number;
    kind: LocationKind;
    name: string;
    color: string | null;
    openTaskCount: number;
    projectCount?: number;
}

export function TaskLocationActionsDialog({ onClose, target }: {
    onClose: () => void;
    target: TaskLocationActionTarget | null;
}) {
    if (target === null) return null;

    return <TaskLocationActionContent key={target.kind + '-' + target.id} onClose={onClose} target={target} />;
}

function TaskLocationActionContent({ onClose, target }: {
    onClose: () => void;
    target: TaskLocationActionTarget;
}) {
    const form = useForm({ name: target.name, color: target.color ?? '#2563EB' });
    const [mode, setMode] = useState<DialogMode>('actions');
    const label = target.kind === 'folder' ? 'Folder' : 'Project';
    const route = '/task-' + (target.kind === 'folder' ? 'folders' : 'projects') + '/' + target.id;

    function submitRename(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.put(route, { preserveScroll: true, onSuccess: onClose });
    }

    function archive() {
        router.post(route + '/archive', {}, { preserveScroll: true, onSuccess: onClose });
    }

    function remove() {
        router.delete(route, { preserveScroll: true, onSuccess: onClose });
    }

    if (mode === 'edit') {
        return <Dialog description={'Choose a clear name and color for this ' + label.toLowerCase() + '.'} onClose={onClose} open title={'Edit ' + label}>
            <form onSubmit={submitRename}>
                <Field autoFocus error={form.errors.name} label={label + ' name'} maxLength={120} onChange={(event) => form.setData('name', event.target.value)} value={form.data.name} />
                <div className="mt-5"><label className="text-sm font-semibold text-secondary" htmlFor="task-location-color">Color</label><div className="mt-2 flex items-center gap-3 rounded-2xl border border-border-strong bg-app p-3"><input className="focus-ring size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0" id="task-location-color" onChange={(event) => form.setData('color', event.target.value.toUpperCase())} type="color" value={form.data.color} /><span className="font-mono text-sm font-bold">{form.data.color}</span></div>{form.errors.color && <p className="mt-2 text-sm text-danger">{form.errors.color}</p>}</div>
                <div className="mt-6 flex justify-end gap-2"><Button onClick={() => setMode('actions')} type="button" variant="ghost">Back</Button><Button disabled={form.processing || !form.data.name.trim()} type="submit">Save changes</Button></div>
            </form>
        </Dialog>;
    }

    if (mode === 'archive') {
        const description = target.kind === 'folder'
            ? `${target.name} and its ${target.projectCount ?? 0} Projects will be hidden from Files. Their Tasks stay intact until you reactivate the Folder.`
            : `${target.name} and its ${target.openTaskCount} open Tasks will be hidden from active task views until you reactivate the Project. Any running Focus Session will be finished.`;

        return <ConfirmationDialog confirmLabel={'Archive ' + label} description={description} onBack={() => setMode('actions')} onClose={onClose} onConfirm={archive} title={'Archive ' + target.name + '?'} />;
    }

    if (mode === 'delete') {
        const description = target.kind === 'folder'
            ? `${target.name} will be permanently deleted. Its Projects will move to Files root; no Tasks will be deleted.`
            : `${target.name} will be permanently deleted. Its Tasks will move to Inbox and future recurring Tasks will no longer be assigned to it.`;

        return <ConfirmationDialog confirmLabel={'Delete permanently'} destructive description={description} onBack={() => setMode('actions')} onClose={onClose} onConfirm={remove} title={'Delete ' + target.name + '?'} />;
    }

    return <Dialog description={'Manage ' + target.name + '.'} onClose={onClose} open title={label + ' actions'}>
        <div className="space-y-3">
            <Button fullWidth onClick={() => setMode('edit')} variant="secondary"><Pencil size={16} />Edit name</Button>
            <Button fullWidth onClick={() => setMode('archive')} variant="ghost"><Archive size={16} />Archive</Button>
            <Button fullWidth onClick={() => setMode('delete')} variant="destructive"><Trash2 size={16} />Delete permanently</Button>
        </div>
    </Dialog>;
}

function ConfirmationDialog({ confirmLabel, description, destructive = false, onBack, onClose, onConfirm, title }: {
    confirmLabel: string;
    description: string;
    destructive?: boolean;
    onBack: () => void;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
}) {
    return <Dialog description={description} onClose={onClose} open title={title}>
        <div className="mt-6 flex justify-end gap-2"><Button onClick={onBack} type="button" variant="ghost">Back</Button><Button onClick={onConfirm} type="button" variant={destructive ? 'destructive' : 'primary'}>{confirmLabel}</Button></div>
    </Dialog>;
}
