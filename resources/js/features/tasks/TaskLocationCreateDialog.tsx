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
        task_folder_id: folderId,
    });
    const label = kind === 'folder' ? 'Folder' : 'Project';

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const name = form.data.name.trim();
        if (!name) return;

        form.transform((data) => ({
            name,
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
                <div className="mt-6 flex justify-end gap-2">
                    <Button onClick={onClose} type="button" variant="ghost">Cancel</Button>
                    <Button disabled={form.processing || !form.data.name.trim()} type="submit">Create {label}</Button>
                </div>
            </form>
        </Dialog>
    );
}
