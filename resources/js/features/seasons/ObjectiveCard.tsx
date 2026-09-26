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
        <article className={`rounded-[1.25rem] border p-4 transition-colors sm:p-5 ${objective.completed ? 'border-success/35 bg-success/6' : 'border-border-subtle bg-app/60'}`}>
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${objective.completed ? 'bg-success/12 text-success' : 'bg-elevated text-secondary'}`}>
                    {objective.completed ? <Check aria-label="Completed" size={20} strokeWidth={2.5} /> : String(objective.order).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                    <h3 className="break-words text-lg font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-xl">{objective.title}</h3>
                    <p className="mt-1 text-sm text-muted">{objective.completed ? 'Outcome completed' : season.state === 'completed' ? 'Not completed' : 'Outcome in progress'}</p>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="text-right">
                        <p className={`whitespace-nowrap text-base font-bold ${objective.completed ? 'text-success' : 'text-accent-ink'}`}>
                            +{objective.rewardSp.toLocaleString()} SP
                        </p>
                        <p className="text-xs text-muted">{objective.completed ? 'Earned' : season.state === 'completed' ? 'Was available' : 'On completion'}</p>
                    </div>
                    {season.objectiveSetupOpen && (
                        <div className="flex gap-1">
                            <Button aria-label={`Rename ${objective.title}`} className="size-10 px-0" onClick={onEdit} size="small" variant="ghost">
                                <Pencil aria-hidden="true" size={16} />
                            </Button>
                            <Button aria-label={`Delete ${objective.title}`} className="size-10 px-0" onClick={onDelete} size="small" variant="ghost">
                                <Trash2 aria-hidden="true" size={16} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            {season.objectiveCompletionMutable ? (
                <button
                    aria-label={`${objective.completed ? 'Mark incomplete' : 'Complete'}: ${objective.title}`}
                    aria-pressed={objective.completed}
                    className={`focus-ring mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-colors ${objective.completed ? 'border-success/45 bg-success/12 text-success hover:bg-success/18' : 'border-border-strong bg-elevated text-secondary hover:border-[var(--module-accent)] hover:text-foreground'}`}
                    onClick={toggleCompletion}
                    type="button"
                >
                    {objective.completed ? <Undo2 aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} />}
                    {objective.completed ? 'Mark incomplete' : 'Mark complete'}
                </button>
            ) : (
                <p className={`mt-4 text-sm font-bold ${objective.completed ? 'text-success' : 'text-muted'}`}>
                    {objective.completed ? 'Completed' : 'Incomplete'}
                </p>
            )}
        </article>
    );
}
