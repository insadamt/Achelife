import { router } from '@inertiajs/react';
import { Check, Pencil, Trash2, Undo2 } from 'lucide-react';

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
            className={`group relative overflow-hidden rounded-[1.35rem] border p-4 transition-[border-color,background-color,transform] duration-200 sm:p-5 ${
                objective.completed
                    ? 'border-success/35 bg-success/6'
                    : 'border-border-strong bg-app hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--module-accent)_48%,var(--border-strong))]'
            }`}
        >
            <div
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1 ${objective.completed ? 'bg-success' : 'bg-[var(--module-accent)]'}`}
            />
            <div className="flex min-h-36 flex-col">
                <div className="flex items-start justify-between gap-4">
                    <span className="grid size-8 place-items-center rounded-full border border-border-subtle bg-elevated text-xs font-bold text-muted">
                        {String(objective.order).padStart(2, '0')}
                    </span>
                    {season.objectiveSetupOpen && (
                        <div className="flex gap-1">
                            <Button aria-label={`Rename ${objective.title}`} className="size-9 px-0" onClick={onEdit} size="small" variant="ghost">
                                <Pencil aria-hidden="true" size={15} />
                            </Button>
                            <Button aria-label={`Delete ${objective.title}`} className="size-9 px-0" onClick={onDelete} size="small" variant="ghost">
                                <Trash2 aria-hidden="true" size={15} />
                            </Button>
                        </div>
                    )}
                </div>

                <h3 className="mt-4 text-xl font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-2xl">
                    {objective.title}
                </h3>

                <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    {season.objectiveCompletionMutable ? (
                        <button
                            aria-label={`${objective.completed ? 'Mark incomplete' : 'Complete'}: ${objective.title}`}
                            aria-pressed={objective.completed}
                            className={`focus-ring inline-flex min-h-10 items-center gap-2 self-start rounded-full border px-3 text-[0.625rem] font-bold tracking-[0.12em] uppercase transition-colors ${
                                objective.completed
                                    ? 'border-success/45 bg-success/12 text-success hover:bg-success/18'
                                    : 'border-border-strong bg-elevated text-secondary hover:border-[var(--module-accent)] hover:text-foreground'
                            }`}
                            onClick={toggleCompletion}
                            type="button"
                        >
                            <span
                                aria-hidden="true"
                                className={`grid size-5 place-items-center rounded-full border ${
                                    objective.completed ? 'border-success bg-success text-[#07150d]' : 'border-border-strong'
                                }`}
                            >
                                {objective.completed && <Check size={12} strokeWidth={3} />}
                            </span>
                            {objective.completed ? (
                                <span className="inline-flex items-center gap-1.5">Completed <Undo2 aria-hidden="true" size={13} /></span>
                            ) : 'Mark complete'}
                        </button>
                    ) : (
                        <p className={`text-xs font-bold tracking-[0.14em] uppercase ${objective.completed ? 'text-success' : 'text-muted'}`}>
                            {objective.completed ? '✓ Completed' : '✕ Incomplete'}
                        </p>
                    )}

                    <div className="shrink-0 text-right">
                        <p className={`text-lg font-bold ${objective.completed ? 'text-success' : 'text-[var(--module-accent)]'}`}>
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
