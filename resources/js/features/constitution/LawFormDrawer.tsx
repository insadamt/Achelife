import { useForm } from '@inertiajs/react';
import { Info, Plus, Save, Scale } from 'lucide-react';
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
            onClose={onClose}
            open
            title={editing ? 'Edit Law' : 'New Law'}
        >
            <form className="space-y-6" onSubmit={submit}>
                <Field
                    autoComplete="off"
                    error={form.errors.name}
                    label="Law"
                    maxLength={255}
                    onChange={(event) => form.setData('name', event.target.value)}
                    placeholder="No social media after 1 AM"
                    required
                    value={form.data.name}
                />

                <fieldset>
                    <legend className="icon-text flex items-center gap-2 text-sm font-semibold text-secondary"><Scale aria-hidden="true" size={16} />Severity</legend>
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
                                    <span>
                                        <span className={`block text-left font-bold tracking-[0.08em] uppercase ${styles.text}`}>{severityLabels[severity]}</span>
                                        <span className="mt-0.5 block text-left text-xs font-semibold text-muted">
                                            {severityPenalties[severity]} · {severityPenalties[severity] * 2} · {severityPenalties[severity] * 3} SP
                                        </span>
                                    </span>
                                    <span className={`text-lg font-bold ${styles.text}`}>{severityPenalties[severity]} SP</span>
                                </button>
                            );
                        })}
                    </div>
                    {form.errors.severity && <p className="mt-2 text-sm text-danger">{form.errors.severity}</p>}
                    {editing && law.violationCount > 0 && (
                        <p className="icon-text mt-3 flex items-start gap-2 text-sm font-semibold text-warning">
                            <Info aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
                            {law.violationCount} existing {law.violationCount === 1 ? 'record keeps' : 'records keep'} the saved severity.
                        </p>
                    )}
                </fieldset>

                <Button disabled={form.processing} fullWidth type="submit">
                    {editing ? <Save aria-hidden="true" size={18} /> : <Plus aria-hidden="true" size={18} />}
                    {editing ? 'Save Law' : 'Create Law'}
                </Button>
            </form>
        </Drawer>
    );
}
