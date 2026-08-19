import { router } from '@inertiajs/react';
import { CalendarDays, Check, ChevronRight, ListChecks, LockKeyhole, MoreHorizontal, Repeat2, Star } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Dialog, Drawer } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { formatCompletionDate, formatTaskDateLong } from './taskPresentation';
import { TaskEditorDialog } from './TaskEditorDialog';
import type { TaskEditor } from './TaskEditorDialog';
import type { TaskViewData } from './types';

type DeleteAction = 'occurrence' | 'future' | null;

interface TaskDetailsDrawerProps {
    task: TaskViewData;
    today: string;
    onClose: () => void;
}

export function TaskDetailsDrawer({ task, today, onClose }: TaskDetailsDrawerProps) {
    const [editor, setEditor] = useState<TaskEditor | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteAction, setDeleteAction] = useState<DeleteAction>(null);
    const completed = task.state === 'completed';

    function closeTopLayer() {
        if (deleteAction) {
            setDeleteAction(null);
            return;
        }
        if (editor) {
            setEditor(null);
            return;
        }
        onClose();
    }

    function markIncomplete() {
        router.delete(`/tasks/${task.id}/completion`, { preserveScroll: true, onSuccess: onClose });
    }

    function confirmDeletion(action: Exclude<DeleteAction, null>) {
        setMenuOpen(false);
        setDeleteAction(action);
    }

    function deleteTask() {
        const endpoint = deleteAction === 'future' ? `/tasks/${task.id}/future` : `/tasks/${task.id}`;
        router.delete(endpoint, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Drawer onClose={closeTopLayer} open title="Task">
            <div className="relative">
                <div className="flex items-start gap-3">
                    <button
                        className={classNames(
                            'focus-ring min-w-0 flex-1 rounded-xl text-left',
                            task.canEdit ? 'hover:text-[var(--module-accent)]' : 'cursor-default',
                        )}
                        disabled={!task.canEdit}
                        onClick={() => setEditor('title')}
                        type="button"
                    >
                        <span className={classNames('block text-2xl font-bold tracking-[-0.03em]', completed && 'text-secondary line-through')}>{task.title}</span>
                    </button>
                    {(task.canDelete || task.canUncomplete) && (
                        <button
                            aria-expanded={menuOpen}
                            aria-label="Task actions"
                            className="focus-ring grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground"
                            onClick={() => setMenuOpen(!menuOpen)}
                            type="button"
                        >
                            <MoreHorizontal size={20} />
                        </button>
                    )}
                </div>

                {menuOpen && (
                    <div className="absolute top-12 right-0 z-10 w-64 rounded-2xl border border-border-strong bg-elevated p-1.5 shadow-2xl">
                        {task.canUncomplete && <MenuAction onClick={markIncomplete}>Mark incomplete</MenuAction>}
                        {task.canDelete && (
                            <>
                                <MenuAction destructive onClick={() => confirmDeletion('occurrence')}>
                                    {task.recurrence ? 'Delete this occurrence' : 'Delete task'}
                                </MenuAction>
                                {task.recurrence && <MenuAction destructive onClick={() => confirmDeletion('future')}>Stop future occurrences</MenuAction>}
                            </>
                        )}
                    </div>
                )}

                <div className="mt-7 space-y-3">
                    <DetailSection editable={task.canEdit} icon={<CalendarDays size={19} />} label="Schedule" onClick={() => setEditor('schedule')}>
                        <span>{formatTaskDateLong(task.scheduledDate)}</span>
                        {task.important && <Star aria-label="Important" className="text-warning" fill="currentColor" size={14} />}
                        {task.recurrence && <span className="icon-text inline-flex items-center gap-1"><Repeat2 size={14} />{task.recurrence.label}</span>}
                    </DetailSection>

                    <DetailSection editable={task.canEdit} icon={<ListChecks size={20} />} label="Checklist" onClick={() => setEditor('checklist')}>
                        {task.totalSubtasks > 0 ? `${task.completedSubtasks} of ${task.totalSubtasks} completed` : 'None'}
                    </DetailSection>

                    <div className="rounded-2xl border border-border-subtle bg-app p-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Reward</span>
                            <span className={classNames('text-2xl font-bold', completed ? 'text-success' : 'text-[var(--module-accent)]')}>
                                +{completed ? task.earnedSp : task.projectedSp} SP
                            </span>
                        </div>
                        {completed && task.completedAt && (
                            <p className="icon-text mt-2 flex items-center gap-1.5 text-xs text-muted">
                                {task.completionLocked ? <LockKeyhole size={13} /> : <Check size={13} />}
                                {formatCompletionDate(task.completedAt)}
                            </p>
                        )}
                    </div>
                </div>

                {task.rescheduleHistory.length > 0 && (
                    <details className="mt-5 rounded-2xl border border-border-subtle px-4 py-3">
                        <summary className="focus-ring cursor-pointer rounded text-sm font-semibold text-secondary">Schedule history</summary>
                        <ul className="mt-3 space-y-2 text-sm text-muted">
                            {task.rescheduleHistory.map((reschedule, index) => (
                                <li key={`${reschedule.rescheduledAt}-${index}`}>{formatTaskDateLong(reschedule.fromDate)} → {formatTaskDateLong(reschedule.toDate)}</li>
                            ))}
                        </ul>
                    </details>
                )}

                {task.completionLocked && (
                    <p className="icon-text mt-5 flex items-start gap-2 rounded-2xl border border-border-subtle bg-app p-4 text-sm leading-6 text-muted">
                        <LockKeyhole className="mt-0.5 shrink-0" size={16} />
                        Locked with its completed Season.
                    </p>
                )}
            </div>

            {editor && <TaskEditorDialog editor={editor} key={`${task.id}-${editor}`} onClose={() => setEditor(null)} task={task} today={today} />}

            <Dialog onClose={() => setDeleteAction(null)} open={deleteAction !== null} title={deleteAction === 'future' ? 'Stop future occurrences?' : task.recurrence ? 'Delete this occurrence?' : 'Delete task?'}>
                <p className="text-sm leading-6 text-secondary">
                    {deleteAction === 'future'
                        ? 'This occurrence and every incomplete occurrence after it will be removed.'
                        : 'This cannot be undone.'}
                </p>
                <div className="mt-6 flex gap-2">
                    <Button fullWidth onClick={() => setDeleteAction(null)} variant="secondary">Cancel</Button>
                    <Button fullWidth onClick={deleteTask} variant="destructive">Delete</Button>
                </div>
            </Dialog>
        </Drawer>
    );
}

function DetailSection({ children, editable, icon, label, onClick }: {
    children: ReactNode;
    editable: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    const content = (
        <>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-[var(--module-accent)]">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold tracking-[0.12em] text-muted uppercase">{label}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-secondary">{children}</span>
            </span>
            {editable && <ChevronRight className="shrink-0 text-muted" size={18} />}
        </>
    );

    return editable ? (
        <button className="focus-ring flex min-h-18 w-full items-center gap-3 rounded-2xl border border-border-subtle bg-app p-3 text-left hover:border-border-strong" onClick={onClick} type="button">
            {content}
        </button>
    ) : (
        <div className="flex min-h-18 items-center gap-3 rounded-2xl border border-border-subtle bg-app p-3">{content}</div>
    );
}

function MenuAction({ children, destructive = false, onClick }: {
    children: ReactNode;
    destructive?: boolean;
    onClick: () => void;
}) {
    return (
        <button className={classNames('focus-ring min-h-10 w-full rounded-xl px-3 text-left text-sm font-semibold hover:bg-surface-hover', destructive ? 'text-danger' : 'text-secondary')} onClick={onClick} type="button">
            {children}
        </button>
    );
}
