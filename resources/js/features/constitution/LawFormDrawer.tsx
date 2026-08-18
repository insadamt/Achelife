import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Drawer, Field } from '../../components/ui';
import { severityLabels, severityPenalties, severityStyles } from './constitutionPresentation';
import type { LawSeverity, LawViewData } from './types';

interface LawFormPayload {
    name: string;
    severity: LawSeverity;
}

export function LawFormDrawer({ law = null, onClose }: { law?: LawViewData | null; onClose: () => void }) {
    const editing = law !== null;
    const form = useForm<LawFormPayload>({
        name: law?.name ?? '',
        severity: law?.severity ?? 'minor',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (law) {
            form.put(`/constitution/laws/${law.id}`, options);
        } else {
            form.post('/constitution/laws', options);
        }
    }

    return (
        <Drawer
            description={editing ? 'Name and severity govern future records.' : 'Define one clear rule and its fixed consequence.'}
            onClose={onClose}
            open
            title={editing ? 'Edit Law' : 'New Law'}
        >
            <form className="space-y-7" onSubmit={submit}>
                <Field
                    autoComplete="off"
                    error={form.errors.name}
                    label="Name"
                    maxLength={255}
                    onChange={(event) => form.setData('name', event.target.value)}
                    placeholder="No social media after 1 AM"
                    required
                    value={form.data.name}
                />

                <fieldset>
                    <legend className="text-sm font-semibold text-secondary">Severity</legend>
                    <div className="mt-2 grid gap-2">
                        {(['minor', 'major', 'critical'] as const).map((severity) => {
                            const styles = severityStyles[severity];
                            const selected = form.data.severity === severity;

                            return (
                                <button
                                    aria-pressed={selected}
                                    className={`focus-ring flex min-h-14 items-center justify-between rounded-2xl border px-4 transition-colors ${selected ? `${styles.border} ${styles.background}` : 'border-border-strong bg-app hover:bg-surface-hover'}`}
                                    key={severity}
                                    onClick={() => form.setData('severity', severity)}
                                    type="button"
                                >
                                    <span className={`font-bold tracking-[0.08em] uppercase ${styles.text}`}>{severityLabels[severity]}</span>
                                    <span className={`text-lg font-bold ${styles.text}`}>{severityPenalties[severity]} SP</span>
                                </button>
                            );
                        })}
                    </div>
                    {form.errors.severity && <p className="mt-2 text-sm text-danger">{form.errors.severity}</p>}
                    {editing && <p className="mt-3 text-sm font-semibold text-warning">Severity changes apply to future violations only.</p>}
                </fieldset>

                <Button disabled={form.processing} fullWidth type="submit">
                    {editing ? 'Save Law' : 'Create Law'}
                </Button>
            </form>
        </Drawer>
    );
}
