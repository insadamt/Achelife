import { Check, CirclePause, Pause, Play, Plus, Square, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { classNames } from '../../components/ui/classNames';
import { FocusTaskFinder } from './FocusTaskFinder';
import { useFocusTimer } from './FocusTimerContext';

export function DynamicIsland({ mobileVisible, mobileTriggerRef, onMobileDismiss }: {
    mobileVisible: boolean;
    mobileTriggerRef: RefObject<HTMLButtonElement | null>;
    onMobileDismiss: () => void;
}) {
    const focus = useFocusTimer();
    const islandRef = useRef<HTMLDivElement>(null);
    const [controlsExpanded, setControlsExpanded] = useState(false);
    const [findingTask, setFindingTask] = useState(false);
    const runningSession = focus.sessions.find((session) => session.running);
    const pausedSessions = focus.sessions.filter((session) => !session.running);

    useEffect(() => {
        if (!mobileVisible || controlsExpanded) return;
        const timer = window.setTimeout(onMobileDismiss, 3500);
        return () => window.clearTimeout(timer);
    }, [controlsExpanded, mobileVisible, onMobileDismiss]);

    useEffect(() => {
        if (!controlsExpanded && !mobileVisible) return;

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (!(event.target instanceof Node) || islandRef.current?.contains(event.target)) return;

            setControlsExpanded(false);
            setFindingTask(false);
            if (mobileVisible && !mobileTriggerRef.current?.contains(event.target)) onMobileDismiss();
        };

        document.addEventListener('click', closeOnOutsideClick, true);
        return () => document.removeEventListener('click', closeOnOutsideClick, true);
    }, [controlsExpanded, mobileVisible, mobileTriggerRef, onMobileDismiss]);

    if (!focus.session && !focus.event) return <p aria-live="polite" className="sr-only">{focus.announcement}</p>;

    if (!focus.session && focus.event) {
        return (
            <div className="focus-island-enter fixed top-18 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-success/35 bg-elevated px-4 py-3 text-sm font-bold shadow-2xl md:top-4" role="status">
                <Check aria-hidden="true" className="text-success" size={18} />
                <span className="truncate">Focus saved · {formatFocusDuration(focus.event.durationSeconds)}</span>
            </div>
        );
    }

    const primaryTitle = runningSession?.taskTitle ?? (pausedSessions.length === 1 ? pausedSessions[0]?.taskTitle : `${pausedSessions.length} Tasks paused`);
    const stateLabel = runningSession ? 'Running' : 'All paused';

    return (
        <div className={classNames(
            'focus-island-enter fixed top-18 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.5rem] border border-border-strong bg-elevated/96 p-2 shadow-2xl backdrop-blur-md md:top-4',
            !mobileVisible && 'max-md:hidden',
        )} aria-label={`Focus ${stateLabel.toLowerCase()}, ${primaryTitle}`} ref={islandRef} role="region">
            <button
                aria-expanded={controlsExpanded}
                aria-label={`${controlsExpanded ? 'Hide' : 'Show'} Focus controls. ${stateLabel}: ${primaryTitle}`}
                className="focus-ring flex min-h-12 w-full items-center justify-center gap-3 rounded-[1.1rem] px-2 text-left hover:bg-surface-hover"
                onClick={() => setControlsExpanded((expanded) => !expanded)}
                type="button"
            >
                <span className={classNames('grid size-9 shrink-0 place-items-center rounded-full', runningSession ? 'bg-[var(--task-accent)] text-accent-foreground' : 'bg-surface-hover text-warning')}>
                    {runningSession ? <Timer aria-hidden="true" size={17} /> : <CirclePause aria-hidden="true" size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{primaryTitle}</span>
                    <span className="block text-[0.6875rem] font-bold tracking-[0.1em] text-muted uppercase">{stateLabel}</span>
                </span>
                {runningSession && <time className="shrink-0 font-mono text-lg font-bold tabular-nums" dateTime={`PT${focus.elapsedSeconds}S`}>
                    {formatFocusClock(focus.elapsedSeconds)}
                </time>}
            </button>

            {controlsExpanded && <div className="max-h-[min(70vh,32rem)] space-y-3 overflow-y-auto px-2 pt-3 pb-1">
                {runningSession && <div className="grid grid-cols-2 gap-2">
                    <button
                        className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-hover px-4 text-sm font-bold hover:brightness-110 disabled:opacity-55"
                        disabled={focus.processing}
                        onClick={focus.pause}
                        type="button"
                    ><Pause aria-hidden="true" size={16} />Pause</button>
                    <button
                        className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger/12 px-4 text-sm font-bold text-danger hover:bg-danger/20 disabled:opacity-55"
                        disabled={focus.processing}
                        onClick={() => focus.stopSession(runningSession.id)}
                        type="button"
                    ><Square aria-hidden="true" fill="currentColor" size={14} />Finish focus</button>
                </div>}

                {pausedSessions.length > 0 && <section aria-label="Paused Focus Tasks" className="space-y-1">
                    <h2 className="px-2 text-xs font-bold text-muted uppercase">{runningSession ? 'Switch to' : 'Paused Tasks'}</h2>
                    {pausedSessions.map((pausedSession) => <div className="flex min-h-12 items-center gap-2 rounded-xl bg-surface-hover/60 px-2" key={pausedSession.id}>
                        <CirclePause aria-hidden="true" className="shrink-0 text-warning" size={16} />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{pausedSession.taskTitle}</span>
                            <span className="block font-mono text-xs text-muted">{formatFocusClock(pausedSession.elapsedSeconds)}</span>
                        </span>
                        <button
                            aria-label={`Resume Focus for ${pausedSession.taskTitle}`}
                            className="focus-ring grid size-10 shrink-0 place-items-center rounded-full hover:bg-elevated disabled:opacity-55"
                            disabled={focus.processing}
                            onClick={() => focus.switchTo(pausedSession.taskId, pausedSession.taskTitle)}
                            title="Resume Focus"
                            type="button"
                        ><Play aria-hidden="true" fill="currentColor" size={16} /></button>
                        <button
                            aria-label={`Finish Focus for ${pausedSession.taskTitle}`}
                            className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-danger hover:bg-danger/12 disabled:opacity-55"
                            disabled={focus.processing}
                            onClick={() => focus.stopSession(pausedSession.id)}
                            title="Finish Focus"
                            type="button"
                        ><Square aria-hidden="true" fill="currentColor" size={13} /></button>
                    </div>)}
                </section>}

                <button
                    aria-expanded={findingTask}
                    className="focus-ring flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong text-sm font-bold hover:bg-surface-hover"
                    onClick={() => setFindingTask((open) => !open)}
                    type="button"
                ><Plus aria-hidden="true" size={16} />Find another Task</button>
                {findingTask && <FocusTaskFinder onSelected={() => setFindingTask(false)} />}
                {focus.event && <p className="text-center text-xs font-semibold text-success" role="status">Focus saved · {formatFocusDuration(focus.event.durationSeconds)}</p>}
            </div>}
            <p aria-live="polite" className="sr-only">{focus.announcement}</p>
        </div>
    );
}

export function formatFocusClock(seconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainder = safeSeconds % 60;
    return [hours, minutes, remainder].map((value) => value.toString().padStart(2, '0')).join(':');
}

function formatFocusDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return `${minutes}m`;
    return `${hours}h ${minutes % 60}m`;
}
