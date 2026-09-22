import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Dialog, Field } from '../../components/ui';

type LocationKind = 'folder' | 'project';

export function TaskLocationCreateDialog({ folderId, kind, onClose, open }: {
    folderId: number | null;
    kind: LocationKind;
    onClose: () => void;
    open: boolean;
}) {
    const form = useForm({
        name: '',
        color: '#2563EB',
        task_folder_id: folderId,
    });
    const label = kind === 'folder' ? 'Folder' : 'Project';

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = form.data.name.trim();
        if (!name) return;

        form.transform((data) => ({
            name,
            color: data.color,
            ...(kind === 'project' ? { task_folder_id: data.task_folder_id } : {}),
        }));
        form.post(kind === 'folder' ? '/task-folders' : '/task-projects', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    }

    return (
        <Dialog
            description={kind === 'folder' ? 'Folders keep related Projects together.' : folderId === null ? 'This Project will appear at the top level.' : 'This Project will be added inside the open Folder.'}
            onClose={onClose}
            open={open}
            title={'New ' + label}
        >
            <form onSubmit={submit}>
                <Field
                    autoComplete="off"
                    autoFocus
                    error={form.errors.name}
                    label={label + ' name'}
                    maxLength={120}
                    onChange={(event) => form.setData('name', event.target.value)}
                    placeholder={kind === 'folder' ? 'For example: Work' : 'For example: Website launch'}
                    value={form.data.name}
                />
                <ColorField color={form.data.color} error={form.errors.color} id={'new-' + kind + '-color'} onChange={(color) => form.setData('color', color)} />
                <div className="mt-6 flex justify-end gap-2">
                    <Button onClick={onClose} type="button" variant="ghost">Cancel</Button>
                    <Button disabled={form.processing || !form.data.name.trim()} type="submit">Create {label}</Button>
                </div>
            </form>
        </Dialog>
    );
}

function ColorField({ color, error, id, onChange }: { color: string; error?: string; id: string; onChange: (color: string) => void }) {
    return <div className="mt-5"><label className="text-sm font-semibold text-secondary" htmlFor={id}>Color</label><div className="mt-2 flex items-center gap-3 rounded-2xl border border-border-strong bg-app p-3"><input className="focus-ring size-10 cursor-pointer rounded-xl border-0 bg-transparent p-0" id={id} onChange={(event) => onChange(event.target.value.toUpperCase())} type="color" value={color} /><span className="font-mono text-sm font-bold">{color}</span></div>{error && <p className="mt-2 text-sm text-danger">{error}</p>}</div>;
}
