import { Check, CirclePause, Pause, Play, Square, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { useFocusTimer } from './FocusTimerContext';

export function DynamicIsland({ mobileVisible, onMobileDismiss }: { mobileVisible: boolean; onMobileDismiss: () => void }) {
    const focus = useFocusTimer();
    const [controlsExpanded, setControlsExpanded] = useState(false);

    useEffect(() => {
        if (!mobileVisible || controlsExpanded) return;
        const timer = window.setTimeout(onMobileDismiss, 3500);
        return () => window.clearTimeout(timer);
    }, [controlsExpanded, mobileVisible, onMobileDismiss]);

    if (focus.event?.type === 'focus-saved') {
        return (
            <div className="focus-island-enter fixed top-18 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-success/35 bg-elevated px-4 py-3 text-sm font-bold shadow-2xl md:top-4" role="status">
                <Check aria-hidden="true" className="text-success" size={18} />
                <span className="truncate">Focus saved · {formatFocusDuration(focus.event.durationSeconds)}</span>
            </div>
        );
    }

    if (!focus.session) return <p aria-live="polite" className="sr-only">{focus.announcement}</p>;

    const stateLabel = focus.session.running ? 'Running' : 'Paused';

    return (
        <div className={classNames(
            'focus-island-enter fixed top-18 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 rounded-[1.5rem] border border-border-strong bg-elevated/96 p-2 shadow-2xl backdrop-blur-md md:top-4',
            !mobileVisible && 'max-md:hidden',
        )} aria-label={`${stateLabel} Focus for ${focus.session.taskTitle}, ${formatFocusClock(focus.elapsedSeconds)}`} role="region">
            <button
                aria-expanded={controlsExpanded}
                aria-label={`${controlsExpanded ? 'Hide' : 'Show'} Focus controls for ${focus.session.taskTitle}`}
                className="focus-ring flex min-h-12 w-full items-center justify-center gap-3 rounded-[1.1rem] px-2 text-left hover:bg-surface-hover"
                onClick={() => setControlsExpanded((expanded) => !expanded)}
                type="button"
            >
                <span className={classNames('grid size-9 shrink-0 place-items-center rounded-full', focus.session.running ? 'bg-[var(--task-accent)] text-accent-foreground' : 'bg-surface-hover text-warning')}>
                    {focus.session.running ? <Timer aria-hidden="true" size={17} /> : <CirclePause aria-hidden="true" size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{focus.session.taskTitle}</span>
                    <span className="block text-[0.6875rem] font-bold tracking-[0.1em] text-muted uppercase">{stateLabel}</span>
                </span>
                <time className="shrink-0 font-mono text-lg font-bold tabular-nums" dateTime={`PT${focus.elapsedSeconds}S`}>
                    {formatFocusClock(focus.elapsedSeconds)}
                </time>
            </button>

            <div className={classNames('grid-cols-2 gap-2 px-2 pt-2 pb-1', controlsExpanded ? 'grid' : 'hidden')}>
                <button
                    className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-surface-hover px-4 text-sm font-bold hover:brightness-110 disabled:cursor-wait disabled:opacity-55"
                    disabled={focus.processing}
                    onClick={focus.session.running ? focus.pause : focus.resume}
                    type="button"
                >
                    {focus.session.running ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
                    {focus.session.running ? 'Pause' : 'Resume'}
                </button>
                <button
                    className="focus-ring icon-text flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger/12 px-4 text-sm font-bold text-danger hover:bg-danger/20 disabled:cursor-wait disabled:opacity-55"
                    disabled={focus.processing}
                    onClick={focus.stop}
                    type="button"
                >
                    <Square aria-hidden="true" fill="currentColor" size={14} />
                    Stop
                </button>
            </div>
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
