import { useForm } from '@inertiajs/react';
import { Clock3, Save, Trash2, TriangleAlert } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Field } from '../../components/ui';
import { formatTaskFocusDate, formatTaskFocusDuration, formatTaskFocusTime } from './taskFocusPresentation';
import type { TaskFocusHistorySession, TaskViewData } from './types';

interface FocusFormData {
    started_at: string;
    ended_at: string;
}

export type TaskFocusSessionEditorTarget =
    | { action: 'create' }
    | { action: 'edit' | 'delete'; session: TaskFocusHistorySession };

export function TaskFocusSessionEditor({ onClose, target, task }: {
    onClose: () => void;
    target: TaskFocusSessionEditorTarget;
    task: TaskViewData;
}) {
    if (target.action === 'delete') {
        return <DeleteFocusSessionEditor onClose={onClose} session={target.session} task={task} />;
    }

    return <FocusSessionForm onClose={onClose} session={target.action === 'edit' ? target.session : null} task={task} />;
}

function FocusSessionForm({ onClose, session, task }: {
    onClose: () => void;
    session: TaskFocusHistorySession | null;
    task: TaskViewData;
}) {
    const form = useForm<FocusFormData>({
        started_at: session?.localStartedAt ?? '',
        ended_at: session?.localEndedAt ?? '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: onClose };

        if (session === null) {
            form.post(`/tasks/${task.id}/focus-sessions/manual`, options);
            return;
        }

        form.put(`/task-focus-sessions/${session.id}`, options);
    }

    return (
        <form onSubmit={submit}>
            <div className="rounded-2xl border border-border-subtle bg-app px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Clock3 aria-hidden="true" className="text-accent-ink" size={17} />
                    {task.focus.timezone}
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">A session may be up to 24 hours and cannot overlap another Focus interval.</p>
            </div>

            {session && session.intervalCount > 1 && (
                <p className="mt-4 flex items-start gap-2 rounded-2xl border border-warning/35 bg-warning/8 p-4 text-sm leading-6 text-warning">
                    <TriangleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
                    This timer session contains pause gaps. Saving replaces those segments with one corrected interval.
                </p>
            )}

            <div className="mt-5 space-y-4">
                <Field autoFocus error={form.errors.started_at} label="Started" onChange={(event) => form.setData('started_at', event.target.value)} required type="datetime-local" value={form.data.started_at} />
                <Field error={form.errors.ended_at} label="Ended" onChange={(event) => form.setData('ended_at', event.target.value)} required type="datetime-local" value={form.data.ended_at} />
            </div>
            {'focus' in form.errors && <p className="mt-3 text-sm font-medium text-danger" role="alert">{String(form.errors.focus)}</p>}

            <div className="mt-7 flex gap-2 border-t border-border-subtle pt-5">
                <Button className="flex-1" onClick={onClose} type="button" variant="secondary">Cancel</Button>
                <Button className="flex-1" disabled={form.processing} type="submit">
                    <Save aria-hidden="true" size={16} />
                    {form.processing ? 'Saving…' : session ? 'Save session' : 'Add session'}
                </Button>
            </div>
        </form>
    );
}

function DeleteFocusSessionEditor({ onClose, session, task }: {
    onClose: () => void;
    session: TaskFocusHistorySession;
    task: TaskViewData;
}) {
    const form = useForm({});

    return (
        <div>
            <div className="rounded-2xl border border-danger/35 bg-danger/8 p-5">
                <TriangleAlert aria-hidden="true" className="text-danger" size={22} />
                <h3 className="mt-4 text-lg font-bold text-foreground">Remove this Focus Session?</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">This permanently removes {formatTaskFocusDuration(session.durationSeconds)} from the Task’s Focus total.</p>
            </div>

            <dl className="mt-5 divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-app px-4">
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="text-muted">Date</dt>
                    <dd className="font-bold text-foreground">{formatTaskFocusDate(session.startedAt, task.focus.timezone)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="text-muted">Time</dt>
                    <dd className="font-bold text-foreground">{formatTaskFocusTime(session.startedAt, task.focus.timezone)}–{formatTaskFocusTime(session.endedAt, task.focus.timezone)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <dt className="text-muted">Focused</dt>
                    <dd className="font-bold text-foreground">{formatTaskFocusDuration(session.durationSeconds)}</dd>
                </div>
            </dl>

            <div className="mt-7 flex gap-2 border-t border-border-subtle pt-5">
                <Button className="flex-1" onClick={onClose} type="button" variant="secondary">Keep session</Button>
                <Button className="flex-1" disabled={form.processing} onClick={() => form.delete(`/task-focus-sessions/${session.id}`, { preserveScroll: true, onSuccess: onClose })} type="button" variant="destructive">
                    <Trash2 aria-hidden="true" size={16} />
                    {form.processing ? 'Deleting…' : 'Delete session'}
                </Button>
            </div>
        </div>
    );
}
