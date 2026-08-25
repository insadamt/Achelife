import { router } from '@inertiajs/react';
import { Clock3, LockKeyhole, Plus, Sparkles, Target } from 'lucide-react';
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

    function deleteObjective(objective: ObjectiveViewData) {
        router.delete(`/seasons/${season.id}/objectives/${objective.id}`, {
            preserveScroll: true,
            onSuccess: () => setDeletingObjectiveId(null),
        });
    }

    return (
        <Surface className="mt-5 p-5 sm:p-7" elevated>
            <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-[var(--module-accent)]">
                        <Target aria-hidden="true" size={21} />
                    </span>
                    <div>
                        <h2 className="text-2xl font-bold tracking-[-0.035em]">Objectives</h2>
                        <p className="mt-0.5 text-xs font-bold tracking-[0.12em] text-muted uppercase">
                            {season.objectiveCompletedCount} / {season.objectiveCount} complete
                        </p>
                    </div>
                </div>
                {mayAdd && (
                    <Button aria-label="Add Objective" className="size-11 px-0 sm:w-auto sm:px-4" onClick={() => onCreatingChange(true)}>
                        <Plus aria-hidden="true" size={16} />
                        <span className="hidden sm:inline">Add</span>
                    </Button>
                )}
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-app px-3 text-xs font-bold text-secondary">
                    <Target aria-hidden="true" size={14} />
                    {season.objectiveCount} / 3 slots
                </span>
                <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-app px-3 text-xs font-bold text-secondary">
                    <Sparkles aria-hidden="true" className="text-[var(--module-accent)]" size={14} />
                    {season.objectiveCount > 0 ? `${season.objectiveRewardPerObjective.toLocaleString()} SP each` : '300 SP pool'}
                </span>
                <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-app px-3 text-xs font-bold text-secondary">
                    <Sparkles aria-hidden="true" className="text-success" size={14} />
                    {season.objectiveEarnedSp.toLocaleString()} SP earned
                </span>
                <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-app px-3 text-xs font-bold text-secondary">
                    {season.objectiveSetupOpen ? <Clock3 aria-hidden="true" className="text-warning" size={14} /> : <LockKeyhole aria-hidden="true" size={14} />}
                    {season.state === 'completed'
                        ? 'History'
                        : season.objectiveSetupOpen
                          ? season.objectiveSetupDaysRemaining === 0
                              ? 'Locks tonight'
                              : `${season.objectiveSetupDaysRemaining}d to edit`
                          : 'Set locked'}
                </span>
            </div>

            {season.objectives.length === 0 ? (
                <div className="mt-5 grid min-h-44 place-items-center rounded-[1.5rem] border border-dashed border-border-strong bg-app p-6 text-center">
                    <div>
                        <span className="mx-auto grid size-12 place-items-center rounded-full border border-border-strong bg-elevated text-muted">
                            <Plus aria-hidden="true" size={21} />
                        </span>
                        <p className="mt-4 text-xl font-bold tracking-[-0.03em]">
                            {season.objectiveSetupOpen ? 'Choose your first outcome' : 'No Objectives recorded'}
                        </p>
                        {mayAdd && (
                            <Button className="mt-4" onClick={() => onCreatingChange(true)} size="small">
                                <Plus aria-hidden="true" size={17} />
                                Create Objective
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
