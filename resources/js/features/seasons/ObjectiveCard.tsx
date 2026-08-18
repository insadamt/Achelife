import { router } from '@inertiajs/react';

import { Button } from '../../components/ui';
import type { ObjectiveViewData, SeasonViewData } from './types';

export function ObjectiveCard({
    objective,
    season,
    onEdit,
    onDelete,
}: {
    objective: ObjectiveViewData;
    season: SeasonViewData;
    onEdit: () => void;
    onDelete: () => void;
}) {
    function toggleCompletion() {
        router.post(
            `/seasons/${season.id}/objectives/${objective.id}/toggle`,
            {},
            { preserveScroll: true },
        );
    }

    return (
        <article
            className={`group relative overflow-hidden rounded-[1.5rem] border p-5 transition-[border-color,background-color,transform] duration-200 sm:p-6 ${
                objective.completed
                    ? 'border-success/35 bg-success/6'
                    : 'border-border-strong bg-app hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--module-accent)_48%,var(--border-strong))]'
            }`}
        >
            <div
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1 ${objective.completed ? 'bg-success' : 'bg-[var(--module-accent)]'}`}
            />
            <div className="flex min-h-52 flex-col">
                <div className="flex items-start justify-between gap-4">
                    <span className="text-4xl font-bold tracking-[-0.06em] text-muted">
                        {String(objective.order).padStart(2, '0')}
                    </span>
                    {season.objectiveSetupOpen && (
                        <div className="flex gap-1">
                            <Button aria-label={`Rename ${objective.title}`} onClick={onEdit} size="small" variant="ghost">
                                Edit
                            </Button>
                            <Button aria-label={`Delete ${objective.title}`} onClick={onDelete} size="small" variant="ghost">
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                <h3 className="mt-7 text-2xl font-bold leading-tight tracking-[-0.035em] text-foreground uppercase sm:text-3xl">
                    {objective.title}
                </h3>

                <div className="mt-auto flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between">
                    {season.objectiveCompletionMutable ? (
                        <button
                            aria-label={`${objective.completed ? 'Mark incomplete' : 'Complete'}: ${objective.title}`}
                            aria-pressed={objective.completed}
                            className={`focus-ring inline-flex min-h-12 items-center gap-3 self-start rounded-full border px-4 text-xs font-bold tracking-[0.14em] uppercase transition-colors ${
                                objective.completed
                                    ? 'border-success/45 bg-success/12 text-success hover:bg-success/18'
                                    : 'border-border-strong bg-elevated text-secondary hover:border-[var(--module-accent)] hover:text-foreground'
                            }`}
                            onClick={toggleCompletion}
                            type="button"
                        >
                            <span
                                aria-hidden="true"
                                className={`grid size-6 place-items-center rounded-full border text-sm ${
                                    objective.completed ? 'border-success bg-success text-[#07150d]' : 'border-border-strong'
                                }`}
                            >
                                {objective.completed ? '✓' : ''}
                            </span>
                            {objective.completed ? 'Completed' : 'Incomplete'}
                        </button>
                    ) : (
                        <p className={`text-xs font-bold tracking-[0.14em] uppercase ${objective.completed ? 'text-success' : 'text-muted'}`}>
                            {objective.completed ? '✓ Completed' : '✕ Incomplete'}
                        </p>
                    )}

                    <div className="sm:text-right">
                        <p className={`text-2xl font-bold ${objective.completed ? 'text-success' : 'text-[var(--module-accent)]'}`}>
                            +{objective.rewardSp.toLocaleString()} SP
                        </p>
                        <p className="mt-1 text-[0.625rem] font-bold tracking-[0.15em] text-muted uppercase">
                            {objective.completed ? 'Earned' : 'On completion'}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
