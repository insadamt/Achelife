import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button, Dialog } from '../../components/ui';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveFormDialog } from './ObjectiveFormDialog';
import type { ObjectiveViewData, SeasonViewData } from './types';

function SetupWindow({ season }: { season: SeasonViewData }) {
    if (season.state === 'completed') {
        return (
            <div className="rounded-2xl border border-border-subtle bg-app px-4 py-3">
                <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">Historical record</p>
                <p className="mt-1 text-sm font-semibold text-secondary">Completed Season · Objectives permanently locked</p>
            </div>
        );
    }

    if (!season.objectiveSetupOpen) {
        return (
            <div className="rounded-2xl border border-warning/30 bg-warning/6 px-4 py-3">
                <p className="text-[0.625rem] font-bold tracking-[0.16em] text-warning uppercase">Objective set locked</p>
                <p className="mt-1 text-sm font-semibold text-secondary">Completion remains available through Day 30.</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[color-mix(in_srgb,var(--module-accent)_35%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--module-accent)_7%,transparent)] px-4 py-3">
            <p className="text-[0.625rem] font-bold tracking-[0.16em] text-[var(--module-accent)] uppercase">Setup window</p>
            <p className="mt-1 text-sm font-semibold text-secondary">
                {season.objectiveSetupDaysRemaining === 0
                    ? 'Final setup day · Objectives lock after today'
                    : `${season.objectiveSetupDaysRemaining} ${season.objectiveSetupDaysRemaining === 1 ? 'day' : 'days'} remaining`}
            </p>
        </div>
    );
}

export function ObjectiveBoard({ season }: { season: SeasonViewData }) {
    const [creating, setCreating] = useState(false);
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
        <div>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-[var(--module-accent)] uppercase">Season mission board</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Objectives</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">
                        Up to three defining outcomes. Every Objective is either incomplete or completed.
                    </p>
                </div>
                <SetupWindow season={season} />
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-border-subtle bg-app p-4 sm:grid-cols-3 sm:p-5">
                <div>
                    <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">Objective set</p>
                    <p className="mt-1 text-2xl font-bold">{season.objectiveCount} / 3</p>
                </div>
                <div>
                    <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">Each Objective</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--module-accent)]">
                        {season.objectiveRewardPerObjective.toLocaleString()} SP
                    </p>
                </div>
                <div>
                    <p className="text-[0.625rem] font-bold tracking-[0.16em] text-muted uppercase">Earned</p>
                    <p className="mt-1 text-2xl font-bold text-success">
                        {season.objectiveEarnedSp.toLocaleString()} / {season.objectiveRewardMaximum.toLocaleString()} SP
                    </p>
                </div>
            </div>

            {season.objectives.length === 0 ? (
                <div className="mt-6 grid min-h-72 place-items-center rounded-[1.5rem] border border-dashed border-border-strong bg-app p-8 text-center">
                    <div>
                        <p className="text-3xl font-bold tracking-[-0.04em]">No Objectives this Season</p>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">
                            {season.objectiveSetupOpen
                                ? 'Set the first major outcome. One Objective carries the full 300 SP reward.'
                                : 'This Season has no Objective history.'}
                        </p>
                        {mayAdd && (
                            <Button className="mt-6" onClick={() => setCreating(true)}>
                                + Add Objective
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

            {mayAdd && season.objectives.length > 0 && (
                <Button className="mt-6" onClick={() => setCreating(true)}>
                    + Add Objective
                </Button>
            )}

            {season.state === 'completed' && season.objectiveCount > 0 && (
                <p className="mt-6 text-sm font-semibold text-secondary">
                    {season.objectiveCompletedCount} / {season.objectiveCount} completed · {season.objectiveEarnedSp.toLocaleString()} /{' '}
                    {season.objectiveRewardMaximum.toLocaleString()} SP earned
                </p>
            )}

            {creating && season.id !== null && <ObjectiveFormDialog onClose={() => setCreating(false)} seasonId={season.id} />}
            {editingObjective && season.id !== null && (
                <ObjectiveFormDialog objective={editingObjective} onClose={() => setEditingObjectiveId(null)} seasonId={season.id} />
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
        </div>
    );
}
