import { Clock3, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { formatTaskFocusDate, formatTaskFocusDuration, formatTaskFocusTime } from './taskFocusPresentation';
import type { TaskFocusHistorySession, TaskViewData } from './types';

interface TaskFocusHistoryProps {
    activeSessionId: number | null;
    addingSession: boolean;
    onAddSession: () => void;
    onDeleteSession: (session: TaskFocusHistorySession) => void;
    onEditSession: (session: TaskFocusHistorySession) => void;
    task: TaskViewData;
}

export function TaskFocusHistory({ activeSessionId, addingSession, onAddSession, onDeleteSession, onEditSession, task }: TaskFocusHistoryProps) {
    return (
        <section className={classNames('mt-5 rounded-2xl border bg-app p-4 transition-colors', addingSession ? 'border-[var(--module-accent)]' : 'border-border-subtle')} aria-labelledby={`task-${task.id}-focus-heading`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Focus Time</p>
                    <h2 className="mt-1 text-2xl font-bold" id={`task-${task.id}-focus-heading`}>{formatTaskFocusDuration(task.focus.totalSeconds)}</h2>
                    <p className="mt-1 text-xs text-muted">Completed time · {task.focus.timezone}</p>
                </div>
                <Button aria-pressed={addingSession} onClick={onAddSession} size="small" type="button" variant={addingSession ? 'primary' : 'secondary'}>
                    <Plus aria-hidden="true" size={16} /> Add time
                </Button>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">Completed sessions</h3>
                <span className="text-xs text-muted">{task.focus.sessions.length}</span>
            </div>
            {task.focus.sessions.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-muted">No completed Focus Sessions yet.</p>
            ) : (
                <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                    {task.focus.sessions.map((session) => {
                        const selected = activeSessionId === session.id;

                        return (
                            <li className={classNames('flex items-center gap-2 rounded-xl border bg-elevated p-2 transition-[border-color,background-color]', selected ? 'border-[var(--module-accent)] bg-surface-hover' : 'border-border-subtle')} key={session.id}>
                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-hover text-accent-ink"><Clock3 aria-hidden="true" size={16} /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-bold">{formatTaskFocusDate(session.startedAt, task.focus.timezone)}</span>
                                    <span className="mt-0.5 block text-xs text-muted">
                                        {formatTaskFocusTime(session.startedAt, task.focus.timezone)}–{formatTaskFocusTime(session.endedAt, task.focus.timezone)} · {formatTaskFocusDuration(session.durationSeconds)}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted">
                                        {session.source === 'timer' ? 'Timer' : 'Manual'}{session.intervalCount > 1 ? ' · Includes pause gaps' : ''}
                                    </span>
                                </span>
                                <button aria-label="Edit Focus Session" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => onEditSession(session)} type="button"><Pencil aria-hidden="true" size={15} /></button>
                                <button aria-label="Delete Focus Session" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-muted hover:bg-danger/12 hover:text-danger" onClick={() => onDeleteSession(session)} type="button"><Trash2 aria-hidden="true" size={15} /></button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
