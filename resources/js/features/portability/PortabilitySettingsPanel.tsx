import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Download, FileArchive, RotateCcw, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';
import { RestorePreviewCard } from './RestorePreviewCard';
import type { RestorePreview } from './types';

export function PortabilitySettingsPanel({ restorePreview }: { restorePreview: RestorePreview | null }) {
    const exportError = (usePage().props.errors as Record<string, string> | undefined)?.export;
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
        <section className="mt-6 rounded-[2rem] border border-border-subtle bg-surface p-5 shadow-[var(--shadow-panel)] sm:p-7">
            <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent-ink"><FileArchive size={21} /></span>
                <div><p className="text-xs font-bold tracking-[0.14em] text-accent-ink uppercase">Backup and restore</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Account data</h2><p className="mt-2 text-sm leading-6 text-muted">Export a transactionally consistent snapshot or replace this account from a validated Achelife archive.</p></div>
            </div>

            <div className="mt-6 rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-warning">
                Archives contain sensitive Diary writing and complete financial history. Store and transfer them like a private password vault.
            </div>

            <div className="mt-6 rounded-2xl border border-border-subtle bg-app/55 p-5"><div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-accent-ink" size={20} /><div><h3 className="font-bold">Keep a portable copy</h3><p className="mt-1 text-sm leading-6 text-muted">Download a complete snapshot before moving devices or making major changes.</p></div></div><a className="focus-ring icon-text mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground" href="/settings/portability/export"><Download aria-hidden="true" size={17} /> Download account archive</a></div>
            {exportError && <p className="mt-3 text-sm font-medium text-danger" role="alert">{exportError}</p>}

            <form className="mt-8 border-t border-border-subtle pt-6" onSubmit={preview}>
                <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Step 1 of 2</p><h3 className="mt-1 font-bold">Validate a replacement archive</h3>
                <p className="mt-1 text-sm leading-6 text-muted">Nothing changes during validation. Unsafe, corrupt, incompatible, or inconsistent archives are rejected.</p>
                <label className="mt-4 block text-sm font-semibold text-secondary" htmlFor="replacement-archive">Achelife archive</label>
                <input accept=".zip,.achelife.zip,application/zip" className="focus-ring mt-2 block w-full rounded-2xl border border-border-strong bg-app p-3 text-sm" id="replacement-archive" onChange={(event) => upload.setData('archive', event.target.files?.[0] ?? null)} type="file" />
                {upload.errors.archive && <p className="mt-2 text-sm font-medium text-danger" role="alert">{upload.errors.archive}</p>}
                <Button className="mt-4" disabled={upload.processing || upload.data.archive === null} type="submit">{upload.processing ? 'Validating…' : 'Validate and preview'}</Button>
            </form>

            {restorePreview && <RestorePreviewCard preview={restorePreview} />}

            {restorePreview && (
                <form className="mt-6 rounded-2xl border border-danger/35 bg-danger/5 p-5" onSubmit={replace}>
                    <p className="text-xs font-bold tracking-[0.14em] text-danger uppercase">Step 2 of 2 · irreversible account replacement</p><h3 className="mt-1 flex items-center gap-2 font-bold text-danger"><RotateCcw aria-hidden="true" size={18} /> Replace this account</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">Achelife first creates and verifies a safety export. Only then does it replace domain data in one rollback-safe transaction.</p>
                    <div className="mt-4">
                        <Field error={restore.errors.confirmation} label="Type RESTORE" onChange={(event) => restore.setData('confirmation', event.target.value)} value={restore.data.confirmation} />
                    </div>
                    {restore.errors.archive && <p className="mt-3 text-sm font-medium text-danger" role="alert">{restore.errors.archive}</p>}
                    <div className="mt-5 flex items-center justify-between gap-4"><p className="flex items-center gap-2 text-xs leading-5 text-secondary"><CheckCircle2 aria-hidden="true" size={16} />A verified safety export is created first.</p><Button disabled={restore.processing || restore.data.confirmation !== 'RESTORE'} type="submit" variant="destructive">{restore.processing ? 'Restoring…' : 'Create safety export and restore'}</Button></div>
                </form>
            )}
        </section>
    );
}
