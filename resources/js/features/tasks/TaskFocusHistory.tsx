import { useForm } from '@inertiajs/react';
import { Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import type { TaskFocusHistorySession, TaskViewData } from './types';

interface FocusFormData {
    started_at: string;
    ended_at: string;
}

export function TaskFocusHistory({ task }: { task: TaskViewData }) {
    const [editingSession, setEditingSession] = useState<TaskFocusHistorySession | 'new' | null>(null);
    const [deletingSession, setDeletingSession] = useState<TaskFocusHistorySession | null>(null);

    return (
        <section className="mt-5 rounded-2xl border border-border-subtle bg-app p-4" aria-labelledby={`task-${task.id}-focus-heading`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Focus Time</p>
                    <h2 className="mt-1 text-2xl font-bold" id={`task-${task.id}-focus-heading`}>{formatDuration(task.focus.totalSeconds)}</h2>
                    <p className="mt-1 text-xs text-muted">Completed time · {task.focus.timezone}</p>
                </div>
                <Button onClick={() => setEditingSession('new')} size="small" type="button" variant="secondary">
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
                <ul className="mt-3 space-y-2">
                    {task.focus.sessions.map((session) => (
                        <li className="flex items-center gap-3 rounded-xl border border-border-subtle bg-elevated p-3" key={session.id}>
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-hover text-accent-ink"><Clock3 aria-hidden="true" size={16} /></span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold">{formatSessionDate(session.startedAt, task.focus.timezone)}</span>
                                <span className="mt-0.5 block text-xs text-muted">
                                    {formatSessionTime(session.startedAt, task.focus.timezone)}–{formatSessionTime(session.endedAt, task.focus.timezone)} · {formatDuration(session.durationSeconds)}
                                </span>
                                {session.intervalCount > 1 && <span className="mt-0.5 block text-xs text-muted">Timer session with pause gaps</span>}
                            </span>
                            <button aria-label="Edit Focus Session" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-hover hover:text-foreground" onClick={() => setEditingSession(session)} type="button"><Pencil aria-hidden="true" size={16} /></button>
                            <button aria-label="Delete Focus Session" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-danger/12 hover:text-danger" onClick={() => setDeletingSession(session)} type="button"><Trash2 aria-hidden="true" size={16} /></button>
                        </li>
                    ))}
                </ul>
            )}

            {editingSession && <FocusSessionDialog onClose={() => setEditingSession(null)} session={editingSession} task={task} />}
            {deletingSession && <DeleteFocusSessionDialog onClose={() => setDeletingSession(null)} session={deletingSession} />}
        </section>
    );
}

function FocusSessionDialog({ onClose, session, task }: {
    onClose: () => void;
    session: TaskFocusHistorySession | 'new';
    task: TaskViewData;
}) {
    const creating = session === 'new';
    const form = useForm<FocusFormData>({
        started_at: creating ? '' : session.localStartedAt,
        ended_at: creating ? '' : session.localEndedAt,
    });

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };
        if (creating) {
            form.post(`/tasks/${task.id}/focus-sessions/manual`, options);
            return;
        }
        form.put(`/task-focus-sessions/${session.id}`, options);
    }

    return (
        <Dialog onClose={onClose} open title={creating ? 'Add Focus Time' : 'Edit Focus Session'}>
            <form onSubmit={submit}>
                <p className="mb-5 text-sm leading-6 text-secondary">Times use {task.focus.timezone}. A session may be up to 24 hours and cannot overlap any other Focus interval.</p>
                <div className="space-y-4">
                    <Field error={form.errors.started_at} label="Started" onChange={(event) => form.setData('started_at', event.target.value)} required type="datetime-local" value={form.data.started_at} />
                    <Field error={form.errors.ended_at} label="Ended" onChange={(event) => form.setData('ended_at', event.target.value)} required type="datetime-local" value={form.data.ended_at} />
                </div>
                {'focus' in form.errors && <p className="mt-3 text-sm font-medium text-danger" role="alert">{String(form.errors.focus)}</p>}
                <div className="mt-6 flex gap-2">
                    <Button fullWidth onClick={onClose} type="button" variant="secondary">Cancel</Button>
                    <Button disabled={form.processing} fullWidth type="submit">{form.processing ? 'Saving…' : 'Save'}</Button>
                </div>
            </form>
        </Dialog>
    );
}

function DeleteFocusSessionDialog({ onClose, session }: { onClose: () => void; session: TaskFocusHistorySession }) {
    const form = useForm({});

    return (
        <Dialog onClose={onClose} open title="Delete Focus Session?">
            <p className="text-sm leading-6 text-secondary">This removes {formatDuration(session.durationSeconds)} from the Task’s Focus total. This cannot be undone.</p>
            <div className="mt-6 flex gap-2">
                <Button fullWidth onClick={onClose} type="button" variant="secondary">Cancel</Button>
                <Button disabled={form.processing} fullWidth onClick={() => form.delete(`/task-focus-sessions/${session.id}`, { preserveScroll: true, onSuccess: onClose })} type="button" variant="destructive">Delete</Button>
            </div>
        </Dialog>
    );
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return minutes === 0 ? `${seconds}s` : `${minutes}m`;
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

function formatSessionDate(timestamp: string, timezone: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: timezone }).format(new Date(timestamp));
}

function formatSessionTime(timestamp: string, timezone: string): string {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(timestamp));
}
