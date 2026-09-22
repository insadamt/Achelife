import { Play, Square } from 'lucide-react';

import { classNames } from '../../components/ui/classNames';
import { useFocusTimer } from './FocusTimerContext';

export function StartFocusButton({ compact = false, taskId, taskTitle }: {
    compact?: boolean;
    taskId: number;
    taskTitle: string;
}) {
    const focus = useFocusTimer();
    const openSession = focus.sessions.find((session) => session.taskId === taskId);
    const runningForTask = openSession?.running ?? false;
    const label = runningForTask ? 'Finish Focus' : openSession ? 'Resume Focus' : focus.session?.running ? 'Switch Focus' : 'Start Focus';

    return (
        <button
            aria-label={`${label} for ${taskTitle}`}
            className={classNames(
                'focus-ring icon-text inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:cursor-wait disabled:opacity-55',
                compact ? 'size-10 bg-transparent' : 'min-h-11 border border-border-strong px-4 text-sm',
                runningForTask
                    ? compact ? 'text-danger hover:bg-surface-hover' : 'bg-elevated text-danger hover:bg-surface-hover'
                    : openSession
                      ? compact ? 'text-foreground hover:bg-surface-hover' : 'bg-elevated text-foreground hover:bg-surface-hover'
                      : compact
                        ? 'text-foreground hover:bg-surface-hover'
                        : 'bg-elevated text-foreground hover:bg-surface-hover',
            )}
            disabled={focus.processing}
            onClick={() => runningForTask && openSession ? focus.stopSession(openSession.id) : focus.switchTo(taskId, taskTitle)}
            title={label}
            type="button"
        >
            {runningForTask
                ? <Square aria-hidden="true" fill="currentColor" size={compact ? 13 : 14} />
                : <Play aria-hidden="true" fill="currentColor" size={compact ? 15 : 16} />}
            {!compact && <span>{label}</span>}
        </button>
    );
}
