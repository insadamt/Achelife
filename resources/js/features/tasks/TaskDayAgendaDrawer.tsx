import { router } from '@inertiajs/react';
import { CalendarDays, Check, Circle, FolderKanban } from 'lucide-react';
import { useState } from 'react';

import { Drawer } from '../../components/ui';
import { dayLabel } from './taskCalendar';
import type { TaskViewData } from './types';

export function TaskDayAgendaDrawer({ date, onClose, onOpenTask, tasks }: {
    date: string;
    onClose: () => void;
    onOpenTask: (taskId: number) => void;
    tasks: TaskViewData[];
}) {
    return (
        <Drawer onClose={onClose} open title={dayLabel(date)}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">Scheduled Tasks</p>
                <span className="rounded-full bg-elevated px-2.5 py-1 text-sm font-bold text-accent-ink">{tasks.length}</span>
            </div>
            {tasks.length === 0 ? (
                <div className="py-12 text-center">
                    <CalendarDays className="mx-auto text-muted" size={24} />
                    <p className="mt-3 text-sm font-semibold text-secondary">Nothing scheduled.</p>
                    <p className="mt-1 text-xs leading-5 text-muted">Close this drawer to plan this day from the calendar.</p>
                </div>
            ) : (
                <div className="mt-5 space-y-2">
                    {tasks.map((task) => <AgendaTask key={task.id} onOpen={() => onOpenTask(task.id)} task={task} />)}
                </div>
            )}
        </Drawer>
    );
}

function AgendaTask({ onOpen, task }: { onOpen: () => void; task: TaskViewData }) {
    const [processing, setProcessing] = useState(false);

    function complete() {
        if (!task.canComplete || processing) return;
        setProcessing(true);
        router.post(`/tasks/${task.id}/completion`, {}, { preserveScroll: true, onFinish: () => setProcessing(false) });
    }

    return (
        <article className="flex items-center gap-2 rounded-xl border border-border-subtle bg-app p-2">
            <button aria-label={`Complete ${task.title}`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-accent-ink hover:bg-surface-hover disabled:text-muted" disabled={!task.canComplete || processing} onClick={complete} type="button">
                {task.canComplete ? <Circle size={19} /> : <Check size={18} />}
            </button>
            <button className="focus-ring min-w-0 flex-1 rounded-lg py-1 text-left" onClick={onOpen} type="button">
                <span className="block truncate text-sm font-bold">{task.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted">
                    <span className="size-2 rounded-full" style={{ backgroundColor: task.projectColor ?? 'var(--task-accent)' }} />
                    <FolderKanban size={12} />{task.projectName ?? 'Inbox'}
                </span>
            </button>
        </article>
    );
}
