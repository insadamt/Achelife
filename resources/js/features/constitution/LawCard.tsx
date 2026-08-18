import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Button, Dialog, Surface } from '../../components/ui';
import { formatPenalty, severityLabels, severityStyles } from './constitutionPresentation';
import type { LawViewData } from './types';

type Confirmation = 'archive' | 'delete' | null;

export function LawCard({
    law,
    onDetails,
    onEdit,
    onRecord,
}: {
    law: LawViewData;
    onDetails: () => void;
    onEdit: () => void;
    onRecord: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmation, setConfirmation] = useState<Confirmation>(null);
    const styles = severityStyles[law.severity];

    function confirmLifecycle() {
        if (confirmation === 'archive') {
            router.post(`/constitution/laws/${law.id}/archive`, {}, {
                preserveScroll: true,
                onSuccess: () => setConfirmation(null),
            });
        } else if (confirmation === 'delete') {
            router.delete(`/constitution/laws/${law.id}`, {
                preserveScroll: true,
                onSuccess: () => setConfirmation(null),
            });
        }
    }

    return (
        <Surface
            className={`relative overflow-visible border-l-2 p-5 ${styles.border}`}
            elevated
            interactive
            onClick={onDetails}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onDetails();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold tracking-[-0.025em]">{law.name}</h2>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[0.625rem] font-bold tracking-[0.12em] uppercase ${styles.text} ${styles.border} ${styles.background}`}>
                        {severityLabels[law.severity]}
                    </span>
                </div>
                <div className="relative shrink-0">
                    <button
                        aria-expanded={menuOpen}
                        aria-label={`Actions for ${law.name}`}
                        className="focus-ring grid size-10 place-items-center rounded-xl border border-border-subtle text-lg font-bold text-secondary hover:bg-surface-hover hover:text-foreground"
                        onClick={(event) => {
                            event.stopPropagation();
                            setMenuOpen((value) => !value);
                        }}
                        type="button"
                    >
                        ···
                    </button>
                    {menuOpen && (
                        <div className="absolute top-11 right-0 z-20 w-36 rounded-2xl border border-border-strong bg-elevated p-1.5 shadow-2xl">
                            <button className="focus-ring w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); onEdit(); }} type="button">Edit</button>
                            <button className="focus-ring w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-surface-hover" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); setConfirmation('archive'); }} type="button">Archive</button>
                            {law.canDelete && <button className="focus-ring w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/10" onClick={(event) => { event.stopPropagation(); setMenuOpen(false); setConfirmation('delete'); }} type="button">Delete</button>}
                        </div>
                    )}
                </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border-subtle py-4">
                <div>
                    <dt className="text-[0.625rem] font-bold tracking-[0.13em] text-muted uppercase">Base penalty</dt>
                    <dd className={`mt-1 text-xl font-bold ${styles.text}`}>{formatPenalty(law.basePenalty)}</dd>
                </div>
                <div>
                    <dt className="text-[0.625rem] font-bold tracking-[0.13em] text-muted uppercase">This Season</dt>
                    <dd className="mt-1 text-xl font-bold">{law.currentSeasonViolationCount} {law.currentSeasonViolationCount === 1 ? 'violation' : 'violations'}</dd>
                </div>
                <div>
                    <dt className="text-[0.625rem] font-bold tracking-[0.13em] text-muted uppercase">Next multiplier</dt>
                    <dd className={`mt-1 text-4xl font-bold tracking-[-0.04em] ${styles.text}`}>×{law.nextMultiplier}</dd>
                </div>
                <div>
                    <dt className="text-[0.625rem] font-bold tracking-[0.13em] text-muted uppercase">Next penalty</dt>
                    <dd className={`mt-2 text-2xl font-bold ${styles.text}`}>{formatPenalty(law.nextPenalty)}</dd>
                </div>
            </dl>

            <Button
                className="mt-5"
                fullWidth
                onClick={(event) => {
                    event.stopPropagation();
                    onRecord();
                }}
            >
                Record Violation
            </Button>

            <Dialog
                description={confirmation === 'delete'
                    ? 'This Law has no violation history and will be permanently removed.'
                    : 'You will no longer be able to record violations for this Law. Its history remains preserved, and archived Laws cannot be reactivated.'}
                onClose={() => setConfirmation(null)}
                open={confirmation !== null}
                title={confirmation === 'delete' ? 'Delete Law?' : 'Archive Law?'}
            >
                <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => setConfirmation(null)} variant="secondary">Cancel</Button>
                    <Button className="flex-1" onClick={confirmLifecycle} variant={confirmation === 'delete' ? 'destructive' : 'primary'}>
                        {confirmation === 'delete' ? 'Delete permanently' : 'Archive permanently'}
                    </Button>
                </div>
            </Dialog>
        </Surface>
    );
}
