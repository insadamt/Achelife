import { router } from '@inertiajs/react';
import { LockKeyhole, Plus, Sparkles, Target } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, Surface } from '../../components/ui';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveFormDialog } from './ObjectiveFormDialog';
import type { ObjectiveViewData, SeasonViewData } from './types';

export function ObjectiveBoard({
    season,
    creating,
    onCreatingChange,
}: {
    season: SeasonViewData;
    creating: boolean;
    onCreatingChange: (creating: boolean) => void;
}) {
    const [editingObjectiveId, setEditingObjectiveId] = useState<number | null>(null);
    const [deletingObjectiveId, setDeletingObjectiveId] = useState<number | null>(null);
    const editingObjective = season.objectives.find((objective) => objective.id === editingObjectiveId) ?? null;
    const deletingObjective = season.objectives.find((objective) => objective.id === deletingObjectiveId) ?? null;
    const mayAdd = season.objectiveSetupOpen && season.objectiveCount < 3;
    const setupMessage = season.state === 'completed'
        ? 'This Season is complete. Objectives are now read only.'
        : season.objectiveSetupOpen
          ? season.objectiveSetupDaysRemaining === 0
              ? 'You can change your Objective set until tonight.'
              : `${season.objectiveSetupDaysRemaining} days left to change your Objective set.`
          : season.objectiveCount > 0
            ? 'Your Objective set is locked. You can still mark outcomes complete.'
            : 'The setup window has closed for this Season.';

    function deleteObjective(objective: ObjectiveViewData) {
        router.delete(`/seasons/${season.id}/objectives/${objective.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingObjectiveId(null),
        });
    }

    return (
        <Surface className="mt-6 p-5 sm:p-7" elevated>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-accent-ink">
                        <Target aria-hidden="true" size={21} />
                    </span>
                    <div>
                        <h2 className="text-2xl font-bold tracking-[-0.035em]">Objectives</h2>
                        <p className="mt-1 text-sm text-secondary">The outcomes that matter this Season.</p>
                    </div>
                </div>
                {mayAdd && season.objectiveCount > 0 && (
                    <Button className="min-h-11" onClick={() => onCreatingChange(true)}>
                        <Plus aria-hidden="true" size={16} />
                        Add Objective
                    </Button>
                )}
            </div>

            <div className="mt-6 rounded-[1.25rem] bg-app/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                    <div>
                        <p className="text-sm font-bold text-foreground">{season.objectiveCompletedCount} of {season.objectiveCount} completed</p>
                        <p className="mt-1 text-sm text-muted">{season.objectiveCount} of 3 Objective slots used</p>
                    </div>
                    <p className="flex items-center gap-2 text-sm font-bold text-success">
                        <Sparkles aria-hidden="true" size={16} />
                        {season.objectiveEarnedSp.toLocaleString()} SP earned
                    </p>
                </div>
                <div aria-label={`${season.objectiveCompletedCount} of ${season.objectiveCount} Objectives completed`} className="mt-4 grid grid-cols-3 gap-2" role="img">
                    {[0, 1, 2].map((slot) => (
                        <span
                            className={`h-2 rounded-full ${slot < season.objectiveCompletedCount ? 'bg-success' : slot < season.objectiveCount ? 'bg-[color-mix(in_srgb,var(--module-accent)_30%,transparent)]' : 'bg-border-strong'}`}
                            key={slot}
                        />
                    ))}
                </div>
            </div>

            <p className="mt-4 flex items-start gap-2 text-sm leading-5 text-muted">
                {season.objectiveSetupOpen ? <Target aria-hidden="true" className="mt-0.5 shrink-0" size={15} /> : <LockKeyhole aria-hidden="true" className="mt-0.5 shrink-0" size={15} />}
                {setupMessage}
            </p>

            {season.objectives.length === 0 ? (
                <div className="mt-5 grid min-h-44 place-items-center rounded-[1.25rem] border border-dashed border-border-strong bg-app/60 p-6 text-center">
                    <div>
                        <span className="mx-auto grid size-12 place-items-center rounded-full border border-border-strong bg-elevated text-muted">
                            <Plus aria-hidden="true" size={21} />
                        </span>
                        <p className="mt-4 text-xl font-bold tracking-[-0.03em]">
                            {season.objectiveSetupOpen ? 'Choose your first outcome' : 'No Objectives recorded'}
                        </p>
                        {season.objectiveSetupOpen && <p className="mt-2 text-sm text-muted">A clear outcome gives this Season a direction.</p>}
                        {mayAdd && (
                            <Button className="mt-4" onClick={() => onCreatingChange(true)} size="small">
                                <Plus aria-hidden="true" size={17} />
                                Create Objective
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="mt-5 grid gap-3">
                    {season.objectives.map((objective) => (
                        <ObjectiveCard
                            key={objective.id}
                            objective={objective}
                            onDelete={() => setDeletingObjectiveId(objective.id)}
                            onEdit={() => setEditingObjectiveId(objective.id)}
                            season={season}
                        />
                    ))}
                </div>
            )}

            {creating && season.id !== null && (
                <ObjectiveFormDialog objectiveCount={season.objectiveCount} onClose={() => onCreatingChange(false)} seasonId={season.id} />
            )}
            {editingObjective && season.id !== null && (
                <ObjectiveFormDialog
                    objective={editingObjective}
                    objectiveCount={season.objectiveCount}
                    onClose={() => setEditingObjectiveId(null)}
                    seasonId={season.id}
                />
            )}
            {deletingObjective && (
                <Dialog
                    description="The remaining Objective rewards will rebalance immediately. Any earned Objective SP will be reconciled exactly."
                    onClose={() => setDeletingObjectiveId(null)}
                    open
                    title="Delete Objective?"
                >
                    <p className="text-lg font-bold text-foreground">{deletingObjective.title}</p>
                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button onClick={() => setDeletingObjectiveId(null)} variant="secondary">
                            Keep Objective
                        </Button>
                        <Button onClick={() => deleteObjective(deletingObjective)} variant="destructive">
                            Delete Objective
                        </Button>
                    </div>
                </Dialog>
            )}
        </Surface>
    );
}
