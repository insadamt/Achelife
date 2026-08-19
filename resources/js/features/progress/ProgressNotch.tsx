import { Link, router } from '@inertiajs/react';
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { RankBadge, RankProgress } from '../../components/rank';
import { Surface } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { ProgressPanelData } from './types';

const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function formatSignedPoints(points: number) {
    return `${points > 0 ? '+' : ''}${points.toLocaleString()} SP`;
}

function ProgressPanel({ data, onClose }: { data: ProgressPanelData; onClose: () => void }) {
    const panelRef = useRef<HTMLElement>(null);
    const titleId = useId();
    const season = data.season;

    useEffect(() => {
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const bodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus());

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || panelRef.current === null) return;

            const focusableElements = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector));
            const firstElement = focusableElements[0];
            const lastElement = focusableElements.at(-1);

            if (!firstElement || !lastElement) {
                event.preventDefault();
            } else if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = bodyOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            previousFocus?.focus();
        };
    }, [onClose]);

    function toggleObjective(objectiveId: number) {
        router.post(`/seasons/${season.id}/objectives/${objectiveId}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <>
            <button aria-label="Close progress panel" className="fixed inset-0 z-40 cursor-default bg-black/55 backdrop-blur-[1px]" onClick={onClose} type="button" />
            <aside aria-labelledby={titleId} aria-modal="true" className="progress-notch-panel fixed top-16 right-0 bottom-20 z-50 w-[min(91vw,25rem)] overflow-y-auto rounded-l-[2rem] border border-r-0 border-border-strong bg-elevated p-5 shadow-[-26px_0_70px_rgba(0,0,0,0.42)] md:top-3 md:bottom-3 md:p-6" ref={panelRef} role="dialog">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold" id={titleId}>Progress</h2>
                    <button aria-label="Close progress panel" className="focus-ring grid size-10 place-items-center rounded-full text-secondary hover:bg-surface-hover hover:text-foreground" onClick={onClose} type="button">
                        <ChevronRight aria-hidden="true" size={19} />
                    </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                    <Surface className="p-4">
                        <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Today’s SP</p>
                        <p className={classNames('mt-2 text-2xl font-bold', data.todaySp < 0 ? 'text-danger' : 'text-accent')}>{formatSignedPoints(data.todaySp)}</p>
                    </Surface>
                    <Surface className="p-4">
                        <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Season total</p>
                        <p className="mt-2 text-2xl font-bold">{season.seasonPoints.toLocaleString()} SP</p>
                    </Surface>
                </div>

                {season.rank && (
                    <section className="mt-4 rounded-2xl border border-border-subtle bg-surface p-4">
                        <div className="mb-4 flex items-center justify-between gap-4 border-b border-border-subtle pb-3">
                            <span className="flex items-center gap-2 text-sm font-bold"><CalendarDays aria-hidden="true" size={17} />Season {String(season.number).padStart(2, '0')}</span>
                            <span className="text-sm text-secondary">Day {season.day} / 30</span>
                        </div>
                        <RankBadge rank={season.rank} size="medium" />
                        <RankProgress className="mt-4" compact rank={season.rank} />
                    </section>
                )}

                <section className="mt-5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><BookOpen aria-hidden="true" size={17} />Diary</h3>
                    <Link className="focus-ring flex min-h-14 items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-4 hover:border-accent" href={data.diary.href}>
                        <span className={classNames('grid size-8 shrink-0 place-items-center rounded-full border-2', data.diary.state === 'completed' ? 'border-accent bg-accent text-accent-foreground' : 'border-border-strong')}>
                            {data.diary.state === 'completed' && <Check aria-hidden="true" size={16} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-bold">{data.diary.state === 'completed' ? 'Complete' : 'Not completed'}</span>
                        <span className="text-xs text-muted">{data.diary.streak} day streak</span>
                    </Link>
                </section>

                <section className="mt-5">
                    <div className="mb-2 flex items-center justify-between gap-4">
                        <h3 className="flex items-center gap-2 text-sm font-bold"><Target aria-hidden="true" size={17} />Objectives</h3>
                        <span className="text-xs font-semibold text-muted">{season.objectiveCompletedCount} / {season.objectiveCount}</span>
                    </div>
                    <Surface className="px-4">
                        {season.objectives.length > 0 ? season.objectives.map((objective) => (
                            <div className={classNames('flex min-h-14 items-center gap-3 border-b border-border-subtle py-2 last:border-b-0', objective.completed && 'opacity-60')} key={objective.id}>
                                <button aria-label={`${objective.completed ? 'Mark incomplete' : 'Complete'} ${objective.title}`} className={classNames('focus-ring grid size-8 shrink-0 place-items-center rounded-full border-2', objective.completed ? 'border-accent bg-accent text-accent-foreground' : 'border-border-strong hover:border-accent')} disabled={!season.objectiveCompletionMutable} onClick={() => toggleObjective(objective.id)} type="button">
                                    {objective.completed && <Check aria-hidden="true" size={16} strokeWidth={3} />}
                                </button>
                                <span className={classNames('min-w-0 flex-1 truncate text-sm font-bold', objective.completed && 'line-through')}>{objective.title}</span>
                            </div>
                        )) : <p className="py-5 text-sm text-muted">None.</p>}
                    </Surface>
                </section>
            </aside>
        </>
    );
}

export function ProgressNotch({ data }: { data: ProgressPanelData }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button aria-expanded={open} aria-label="Pull open progress panel" className="focus-ring group fixed top-1/2 right-0 z-30 grid h-28 w-7 -translate-y-1/2 place-items-center rounded-l-[1.15rem] border border-r-0 border-border-strong bg-surface shadow-[-10px_10px_28px_rgba(0,0,0,0.34)] transition-[width,background-color,border-color] hover:w-9 hover:border-accent hover:bg-elevated" onClick={() => setOpen(true)} type="button">
                <span aria-hidden="true" className="absolute inset-y-5 left-0 w-px bg-accent/70" />
                <ChevronLeft aria-hidden="true" className="text-accent transition-transform group-hover:-translate-x-0.5" size={17} />
            </button>
            {open && <ProgressPanel data={data} onClose={() => setOpen(false)} />}
        </>
    );
}
