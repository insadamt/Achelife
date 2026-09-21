import { Play } from 'lucide-react';

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
    const label = runningForTask ? 'Focus running' : openSession ? 'Resume Focus' : focus.session?.running ? 'Switch Focus' : 'Start Focus';

    return (
        <button
            aria-label={`${label} for ${taskTitle}`}
            className={classNames(
                'focus-ring icon-text inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:cursor-wait disabled:opacity-55',
                compact ? 'size-10 text-muted hover:bg-surface-hover hover:text-foreground' : 'min-h-11 border border-border-strong bg-elevated px-4 text-sm text-foreground hover:bg-surface-hover',
                openSession && 'text-accent-ink',
            )}
            disabled={focus.processing || runningForTask}
            onClick={() => focus.switchTo(taskId, taskTitle)}
            title={label}
            type="button"
        >
            <Play aria-hidden="true" fill="currentColor" size={compact ? 15 : 16} />
            {!compact && <span>{label}</span>}
        </button>
    );
}
