import { useForm } from '@inertiajs/react';
import { Download, FileArchive, RotateCcw } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';
import { RestorePreviewCard } from './RestorePreviewCard';
import type { RestorePreview } from './types';

export function PortabilitySettingsPanel({ restorePreview }: { restorePreview: RestorePreview | null }) {
    const upload = useForm<{ archive: File | null }>({ archive: null });
    const restore = useForm({ confirmation: '', archive: '' });

    function preview(event: FormEvent) {
        event.preventDefault();
        upload.post('/settings/portability/preview', { forceFormData: true, preserveScroll: true });
    }

    function replace(event: FormEvent) {
        event.preventDefault();
        restore.post('/settings/portability/restore');
    }

    return (
        <section className="mt-6 rounded-[2rem] border border-border-subtle bg-surface p-5 shadow-[0_20px_55px_rgba(0,0,0,0.2)] sm:p-7">
            <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><FileArchive size={21} /></span>
                <div><h2 className="text-xl font-bold">Account data portability</h2><p className="mt-1 text-sm leading-6 text-muted">Export a transactionally consistent snapshot or replace this account from a validated Achelife archive.</p></div>
            </div>

            <div className="mt-6 rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-warning">
                Archives contain sensitive Diary writing and complete financial history. Store and transfer them like a private password vault.
            </div>

            <a className="focus-ring icon-text mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground" href="/settings/portability/export"><Download size={17} /> Download account archive</a>

            <form className="mt-8 border-t border-border-subtle pt-6" onSubmit={preview}>
                <h3 className="font-bold">Preview a replacement</h3>
                <p className="mt-1 text-sm leading-6 text-muted">Nothing is changed during preview. Unsafe, corrupt, incompatible, or inconsistent archives are rejected.</p>
                <label className="mt-4 block text-sm font-semibold text-secondary" htmlFor="replacement-archive">Achelife archive</label>
                <input accept=".zip,.achelife.zip,application/zip" className="focus-ring mt-2 block w-full rounded-2xl border border-border-strong bg-app p-3 text-sm" id="replacement-archive" onChange={(event) => upload.setData('archive', event.target.files?.[0] ?? null)} type="file" />
                {upload.errors.archive && <p className="mt-2 text-sm font-medium text-danger" role="alert">{upload.errors.archive}</p>}
                <Button className="mt-4" disabled={upload.processing || upload.data.archive === null} type="submit">Validate and preview</Button>
            </form>

            {restorePreview && <RestorePreviewCard preview={restorePreview} />}

            {restorePreview && (
                <form className="mt-6 rounded-2xl border border-danger/35 bg-danger/5 p-5" onSubmit={replace}>
                    <h3 className="flex items-center gap-2 font-bold text-danger"><RotateCcw size={18} /> Replace this account</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">Achelife first creates and verifies a safety export. Only then does it replace domain data in one rollback-safe transaction.</p>
                    <div className="mt-4">
                        <Field error={restore.errors.confirmation} label="Type RESTORE" onChange={(event) => restore.setData('confirmation', event.target.value)} value={restore.data.confirmation} />
                    </div>
                    {restore.errors.archive && <p className="mt-3 text-sm font-medium text-danger" role="alert">{restore.errors.archive}</p>}
                    <Button className="mt-5" disabled={restore.processing} type="submit" variant="destructive">Create safety export and restore</Button>
                </form>
            )}
        </section>
    );
}
