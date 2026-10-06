import { router } from '@inertiajs/react';
import gsap from 'gsap';
import { AlertTriangle, Check } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { StartFocusButton } from '../focus/StartFocusButton';
import { ExpandableTaskChecklist } from '../tasks/ExpandableTaskChecklist';
import type { TaskViewData } from '../tasks/types';

export function TodayTaskRow({ task, onOpen }: { task: TaskViewData; onOpen: () => void }) {
    const [processing, setProcessing] = useState(false);
    const [markingComplete, setMarkingComplete] = useState(false);
    const markButtonRef = useRef<HTMLButtonElement>(null);
    const completed = task.state === 'completed';
    const canToggle = completed ? task.canUncomplete : task.canComplete;
    const showCheckmark = completed || markingComplete;

    const finishCompletionRequest = useCallback(() => {
        setProcessing(false);
        setMarkingComplete(false);
    }, []);

    const submitCompletion = useCallback(() => {
        router.post(`/tasks/${task.id}/completion`, {}, {
            preserveScroll: true,
            onFinish: finishCompletionRequest,
        });
    }, [finishCompletionRequest, task.id]);

    useLayoutEffect(() => {
        if (!markingComplete) return;

        const checkPath = markButtonRef.current?.querySelector<SVGPathElement>('svg path');
        if (!checkPath) {
            submitCompletion();
            return;
        }

        const pathLength = checkPath.getTotalLength();
        gsap.set(checkPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
        const drawMark = gsap.timeline()
            .to(checkPath, { strokeDashoffset: 0, duration: 0.38, ease: 'power2.inOut' })
            .call(submitCompletion, [], '+=0.45');

        return () => { drawMark.kill(); };
    }, [markingComplete, submitCompletion]);

    function toggleCompletion() {
        if (!canToggle || processing) return;
        setProcessing(true);

        if (completed) {
            router.delete(`/tasks/${task.id}/completion`, {
                preserveScroll: true,
                onFinish: finishCompletionRequest,
            });
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            submitCompletion();
            return;
        }

        setMarkingComplete(true);
    }

    return (
        <div className="border-b border-border-subtle last:border-b-0">
            <div className="flex min-h-16 items-center gap-3 px-1 py-2">
                <button
                    ref={markButtonRef}
                    aria-label={markingComplete ? `Completing ${task.title}` : completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                    className={classNames(
                        'focus-ring grid size-11 shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color,box-shadow,transform] hover:scale-105',
                        showCheckmark
                            ? `${completed ? 'today-check-pop' : ''} border-[var(--task-accent)] bg-[var(--task-accent)] text-accent-foreground shadow-[0_0_20px_color-mix(in_srgb,var(--task-accent)_20%,transparent)]`
                            : 'border-border-strong bg-elevated hover:border-[var(--task-accent)]',
                        !canToggle && 'cursor-not-allowed opacity-45',
                    )}
                    disabled={!canToggle || processing}
                    onClick={toggleCompletion}
                    type="button"
                >
                    {markingComplete ? (
                        <svg aria-hidden="true" fill="none" height={18} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} viewBox="0 0 24 24" width={18}>
                            <path d="M4 12l5 5L20 6" />
                        </svg>
                    ) : completed && <Check aria-hidden="true" size={18} strokeWidth={3} />}
                </button>
                <button className="focus-ring min-h-11 min-w-0 flex-1 rounded-xl py-1 text-left" onClick={onOpen} type="button">
                    <div className="flex items-center gap-2">
                        <p className={classNames('min-w-0 break-words text-base font-bold', completed && 'text-secondary line-through')}>{task.title}</p>
                        {task.important && <span aria-label="Important" className="size-1.5 shrink-0 rounded-full bg-warning" title="Important" />}
                    </div>
                </button>
                {task.state === 'overdue' && <span className="icon-text flex shrink-0 items-center gap-1.5 text-xs font-bold text-warning"><AlertTriangle aria-hidden="true" size={14} /><span>Overdue</span></span>}
                {!completed && <StartFocusButton compact taskId={task.id} taskTitle={task.title} />}
                {completed && task.earnedSp !== null && <span className="shrink-0 text-xs font-bold text-accent-ink">+{task.earnedSp} SP</span>}
            </div>
            <ExpandableTaskChecklist compact task={task} />
        </div>
    );
}
