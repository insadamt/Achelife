import { router } from '@inertiajs/react';
import { CalendarDays, Check, ChevronRight, FolderKanban, ListChecks, LockKeyhole, MoreHorizontal, Repeat2, Star, StickyNote } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Dialog, Drawer } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import { StartFocusButton } from '../focus/StartFocusButton';
import { formatCompletionDate, formatTaskDateLong } from './taskPresentation';
import { TaskEditorPanel } from './TaskEditorPanel';
import { TaskFocusHistory } from './TaskFocusHistory';
import type { TaskEditorTarget } from './TaskEditorPanel';
import type { TaskExplorerViewData, TaskViewData } from './types';

type DeleteAction = 'occurrence' | 'future' | null;

interface TaskDetailsDrawerProps {
    task: TaskViewData;
    explorer: TaskExplorerViewData;
    today: string;
    onClose: () => void;
}

export function TaskDetailsDrawer({ task, explorer, today, onClose }: TaskDetailsDrawerProps) {
    const [editor, setEditor] = useState<TaskEditorTarget | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteAction, setDeleteAction] = useState<DeleteAction>(null);
    const completed = task.state === 'completed';
    const fieldEditor = editor?.kind === 'focus-session' ? null : editor?.kind;
    const focusSessionTarget = editor?.kind === 'focus-session' ? editor.target : null;
    const selectedFocusSessionId = focusSessionTarget === null || focusSessionTarget.action === 'create'
        ? null
        : focusSessionTarget.session.id;

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
        <Drawer onClose={closeTopLayer} open size={editor ? 'large' : 'default'} title={editor ? 'Task workspace' : 'Task'}>
            <div className={classNames(editor && 'lg:grid lg:grid-cols-[minmax(20rem,0.82fr)_minmax(22rem,1.18fr)] lg:items-start')}>
                <div className={classNames('relative min-w-0', editor && 'hidden lg:block lg:pr-6')}>
                <div className="flex items-start gap-3">
                    <button
                        aria-pressed={fieldEditor === 'title'}
                        className={classNames(
                            'focus-ring min-w-0 flex-1 rounded-xl px-2 py-1 text-left transition-colors',
                            task.canEdit ? 'hover:text-accent-ink' : 'cursor-default',
                            fieldEditor === 'title' && 'bg-[color-mix(in_srgb,var(--module-accent)_12%,transparent)] text-accent-ink',
                        )}
                        disabled={!task.canEdit}
                        onClick={() => setEditor({ kind: 'title' })}
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
                    {!completed && <StartFocusButton taskId={task.id} taskTitle={task.title} />}

                    <DetailSection active={fieldEditor === 'organization'} editable={task.canEdit} icon={<FolderKanban size={19} />} label="Project" onClick={() => setEditor({ kind: 'organization' })}>
                        {task.projectName ?? 'Inbox'}
                    </DetailSection>

                    <DetailSection active={fieldEditor === 'schedule'} editable={task.canEdit} icon={<CalendarDays size={19} />} label="Planning" onClick={() => setEditor({ kind: 'schedule' })}>
                        <span>{formatTaskDateLong(task.scheduledDate)}</span>
                        <span aria-hidden="true" className="text-border-strong">•</span>
                        <span className="inline-flex items-center gap-1.5">
                            <Star aria-hidden="true" fill={task.important ? 'currentColor' : 'none'} size={14} />
                            {task.important ? 'Important' : 'Not important'}
                        </span>
                        <span className="inline-flex basis-full items-center gap-1.5 text-muted">
                            <Repeat2 aria-hidden="true" size={14} />
                            {task.recurrence?.label ?? 'Does not repeat'}
                        </span>
                    </DetailSection>

                    <DetailSection active={fieldEditor === 'checklist'} editable={task.canEdit} icon={<ListChecks size={20} />} label="Checklist" onClick={() => setEditor({ kind: 'checklist' })}>
                        {task.totalSubtasks === 0 ? 'None' : (
                            <span className="block w-full space-y-1.5">
                                <span className="flex items-center justify-between gap-3">
                                    <span>{task.completedSubtasks} of {task.totalSubtasks} completed</span>
                                    <span aria-hidden="true" className="h-1.5 w-16 overflow-hidden rounded-full bg-border-subtle">
                                        <span className="block h-full rounded-full bg-[var(--task-accent)]" style={{ width: `${(task.completedSubtasks / task.totalSubtasks) * 100}%` }} />
                                    </span>
                                </span>
                                <span className="block max-h-48 space-y-1.5 overflow-y-auto pr-1">
                                    {task.subtasks.map((subtask) => (
                                        <span className={classNames('block font-medium', subtask.completed && 'text-muted line-through')} key={subtask.id}>
                                            {subtask.completed ? '✓' : '○'} {subtask.title}
                                        </span>
                                    ))}
                                </span>
                            </span>
                        )}
                    </DetailSection>

                    <DetailSection active={fieldEditor === 'notes'} editable={task.canEdit} icon={<StickyNote size={19} />} label="Notes" onClick={() => setEditor({ kind: 'notes' })}>
                        <span className="whitespace-pre-wrap">{task.notes || 'None'}</span>
                    </DetailSection>

                    <div className="rounded-2xl border border-border-subtle bg-app p-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Reward</span>
                            <span className={classNames('text-2xl font-bold', completed ? 'text-success' : 'text-accent-ink')}>
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

                <TaskFocusHistory
                    activeSessionId={selectedFocusSessionId}
                    addingSession={focusSessionTarget?.action === 'create'}
                    onAddSession={() => setEditor({ kind: 'focus-session', target: { action: 'create' } })}
                    onDeleteSession={(session) => setEditor({ kind: 'focus-session', target: { action: 'delete', session } })}
                    onEditSession={(session) => setEditor({ kind: 'focus-session', target: { action: 'edit', session } })}
                    task={task}
                />

                {task.completionLocked && (
                    <p className="icon-text mt-5 flex items-start gap-2 rounded-2xl border border-border-subtle bg-app p-4 text-sm leading-6 text-muted">
                        <LockKeyhole className="mt-0.5 shrink-0" size={16} />
                        Locked with its completed Season.
                    </p>
                )}
                </div>

                {editor && <TaskEditorPanel editor={editor} explorer={explorer} key={taskEditorKey(task.id, editor)} onClose={() => setEditor(null)} task={task} today={today} />}
            </div>

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

function taskEditorKey(taskId: number, editor: TaskEditorTarget): string {
    if (editor.kind !== 'focus-session') return `${taskId}-${editor.kind}`;
    if (editor.target.action === 'create') return `${taskId}-focus-create`;

    return `${taskId}-focus-${editor.target.action}-${editor.target.session.id}`;
}

function DetailSection({ active = false, children, editable, icon, label, onClick }: {
    active?: boolean;
    children: ReactNode;
    editable: boolean;
    icon: ReactNode;
    label: string;
    onClick: () => void;
}) {
    const content = (
        <>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated text-accent-ink">{icon}</span>
            <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold tracking-[0.12em] text-muted uppercase">{label}</span>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-secondary">{children}</span>
            </span>
            {editable && <ChevronRight className="shrink-0 text-muted" size={18} />}
        </>
    );

    return editable ? (
        <button
            aria-pressed={active}
            className={classNames(
                'focus-ring flex min-h-18 w-full items-center gap-3 rounded-2xl border bg-app p-3 text-left transition-[border-color,background-color,box-shadow] hover:border-border-strong',
                active && 'border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_8%,var(--app-background))] shadow-[0_0_0_2px_color-mix(in_srgb,var(--module-accent)_12%,transparent)]',
            )}
            onClick={onClick}
            type="button"
        >
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
