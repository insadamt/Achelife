import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import type { ObjectiveViewData } from './types';

interface ObjectiveFormPayload {
    title: string;
}

export function ObjectiveFormDialog({
    seasonId,
    objectiveCount,
    objective = null,
    onClose,
}: {
    seasonId: number;
    objectiveCount: number;
    objective?: ObjectiveViewData | null;
    onClose: () => void;
}) {
    const form = useForm<ObjectiveFormPayload>({
        title: objective?.title ?? '',
    });
    const editing = objective !== null;
    const objectiveError = (form.errors as Record<string, string | undefined>).objective;
    const nextObjectiveCount = Math.min(3, objectiveCount + 1);
    const nextReward = nextObjectiveCount === 1 ? 300 : nextObjectiveCount === 2 ? 150 : 100;

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (objective) {
            form.put(`/seasons/${seasonId}/objectives/${objective.id}`, options);
        } else {
            form.post(`/seasons/${seasonId}/objectives`, options);
        }
    }

    return (
        <Dialog
            description={editing ? 'Keep the mission clear and outcome-focused.' : 'Define one major outcome for this Season.'}
            onClose={onClose}
            open
            title={editing ? 'Rename Objective' : 'Add Objective'}
        >
            <form className="space-y-6" onSubmit={submit}>
                <Field
                    autoComplete="off"
                    autoFocus
                    error={form.errors.title}
                    label="Objective"
                    maxLength={255}
                    onChange={(event) => form.setData('title', event.target.value)}
                    placeholder="Finish portfolio"
                    required
                    value={form.data.title}
                />
                {objectiveError && (
                    <p className="text-sm font-semibold text-danger" role="alert">
                        {objectiveError}
                    </p>
                )}
                {!editing && (
                    <div className="rounded-2xl border border-border-subtle bg-app px-4 py-3">
                        <p className="text-[0.625rem] font-bold tracking-[0.15em] text-muted uppercase">Reward after adding</p>
                        <p className="mt-1 text-sm font-semibold text-secondary">
                            {nextObjectiveCount} {nextObjectiveCount === 1 ? 'Objective' : 'Objectives'} · {nextReward} SP each · 300 SP possible
                        </p>
                    </div>
                )}
                <Button disabled={form.processing} fullWidth type="submit">
                    {editing ? 'Save Objective' : 'Create Objective'}
                </Button>
            </form>
        </Dialog>
    );
}
