import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatTaskDate } from '../tasks/taskPresentation';
import { findFocusTasks } from './focusApi';
import type { FocusTaskOption } from './focusApi';
import { useFocusTimer } from './FocusTimerContext';

export function FocusTaskFinder({ onSelected }: { onSelected: () => void }) {
    const focus = useFocusTimer();
    const [search, setSearch] = useState('');
    const [tasks, setTasks] = useState<FocusTaskOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setLoading(true);
            findFocusTasks(search, controller.signal)
                .then((results) => { setTasks(results); setError(''); })
                .catch((reason: unknown) => {
                    if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Tasks could not be loaded.');
                })
                .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        }, 150);

        return () => { window.clearTimeout(timer); controller.abort(); };
    }, [search]);

    const availableTasks = tasks.filter((task) => !focus.sessions.some((session) => session.taskId === task.id));

    return (
        <div className="space-y-2 border-t border-border-subtle pt-3">
            <label className="focus-field-shell flex items-center gap-2 rounded-xl border border-border-strong bg-surface px-3">
                <Search aria-hidden="true" size={16} />
                <span className="sr-only">Find a Task to focus on</span>
                <input
                    autoFocus
                    className="min-h-11 w-full bg-transparent text-sm outline-none"
                    maxLength={100}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find a Task"
                    type="search"
                    value={search}
                />
            </label>
            <div aria-live="polite" className="max-h-48 overflow-y-auto">
                {error && <p className="px-2 py-2 text-sm text-danger">{error}</p>}
                {!error && loading && <p className="px-2 py-2 text-sm text-muted">Loading Tasks…</p>}
                {!error && !loading && availableTasks.length === 0 && <p className="px-2 py-2 text-sm text-muted">No other open Tasks found.</p>}
                {!error && !loading && availableTasks.map((task) => (
                    <button
                        className="focus-ring flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm hover:bg-surface-hover disabled:opacity-55"
                        disabled={focus.processing}
                        key={task.id}
                        onClick={() => { void focus.switchTo(task.id, task.title); onSelected(); }}
                        type="button"
                    >
                        <span className="min-w-0 truncate font-semibold">{task.title}</span>
                        <span className="shrink-0 text-xs text-muted">{task.projectName ? `${task.projectName} · ` : ''}{formatTaskDate(task.scheduledDate)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
