import { Head, router } from '@inertiajs/react';
import { CalendarDays, Check, Circle, FolderKanban, GripVertical } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';

import { classNames } from '../../components/ui/classNames';
import { TaskCalendarControls } from '../../features/tasks/TaskCalendarControls';
import { TaskCalendarGrid } from '../../features/tasks/TaskCalendarGrid';
import { TaskDetailsDrawer } from '../../features/tasks/TaskDetailsDrawer';
import { TaskSectionNav } from '../../features/tasks/TaskSectionNav';
import { calendarHref, dayLabel, tasksByDate } from '../../features/tasks/taskCalendar';
import type { CalendarProject } from '../../features/tasks/taskCalendar';
import type { TaskExplorerViewData, TaskViewData } from '../../features/tasks/types';

interface CalendarPageProps {
    today: string;
    month: string;
    selectedDate: string;
    tasks: TaskViewData[];
    projects: CalendarProject[];
    selectedProjectIds: number[];
    includeInbox: boolean;
    explorer: TaskExplorerViewData;
    intermission: boolean;
}

export default function TaskCalendarPage(props: CalendarPageProps) {
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const byDay = useMemo(() => tasksByDate(props.tasks), [props.tasks]);
    const selectedTasks = byDay.get(props.selectedDate) ?? [];
    const selectedTask = props.tasks.find((task) => task.id === selectedTaskId) ?? null;

    function navigate(date: string, projectIds = props.selectedProjectIds, includeInbox = props.includeInbox) {
        router.get(calendarHref(props.month, date, projectIds, includeInbox), {}, { preserveScroll: true });
    }

    function reschedule(task: TaskViewData, scheduledDate: string) {
        if (task.scheduledDate === scheduledDate) return;
        router.put(`/tasks/${task.id}/reschedule`, { scheduled_date: scheduledDate }, { preserveScroll: true, onSuccess: () => setAnnouncement(`${task.title} moved to ${dayLabel(scheduledDate)}.`) });
    }

    return <div style={{ '--module-accent': 'var(--task-accent)' } as CSSProperties}>
        <Head title="Calendar · Tasks" />
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div><p className="text-sm font-bold text-accent-ink">Task planning</p><h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Calendar</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Plan every open, scheduled Task across your active Projects and Inbox.</p></div>
                <TaskSectionNav active="calendar" />
            </div>
            {props.intermission && <p className="mt-5 rounded-2xl border border-warning/35 bg-warning/10 px-4 py-3 text-sm leading-6 text-warning">Intermission: you can keep planning and rescheduling Tasks. Completion and SP resume when your next Season starts.</p>}
            <TaskCalendarControls includeInbox={props.includeInbox} month={props.month} onFiltersChange={(projectIds, includeInbox) => navigate(props.selectedDate, projectIds, includeInbox)} projectIds={props.selectedProjectIds} projects={props.projects} today={props.today} />
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
                <TaskCalendarGrid month={props.month} onOpenTask={setSelectedTaskId} onReschedule={reschedule} onSelectDate={navigate} selectedDate={props.selectedDate} tasks={props.tasks} tasksByDay={byDay} today={props.today} />
                <DayAgenda allTasks={props.tasks} date={props.selectedDate} onOpenTask={setSelectedTaskId} onReschedule={reschedule} tasks={selectedTasks} />
            </div>
        </div>
        {selectedTask && <TaskDetailsDrawer explorer={props.explorer} key={selectedTask.id} onClose={() => setSelectedTaskId(null)} task={selectedTask} today={props.today} />}
        <p aria-live="polite" className="sr-only">{announcement}</p>
    </div>;
}

function DayAgenda({ allTasks, date, onOpenTask, onReschedule, tasks }: { allTasks: TaskViewData[]; date: string; onOpenTask: (taskId: number) => void; onReschedule: (task: TaskViewData, date: string) => void; tasks: TaskViewData[] }) {
    const [dropActive, setDropActive] = useState(false);
    return <aside aria-label={`${dayLabel(date)} agenda`} className={classNames('mt-5 rounded-2xl border border-border-subtle bg-surface p-4 xl:mt-5', dropActive && 'border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_9%,transparent)]')} onDragLeave={() => setDropActive(false)} onDragOver={(event) => { event.preventDefault(); setDropActive(true); }} onDrop={(event) => { event.preventDefault(); setDropActive(false); const taskId = Number(event.dataTransfer.getData('application/x-achelife-calendar-task')); const task = allTasks.find((candidate) => candidate.id === taskId); if (task) onReschedule(task, date); }}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Focused day</p><h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">{dayLabel(date)}</h2></div><span className="rounded-full bg-elevated px-2.5 py-1 text-sm font-bold text-accent-ink">{tasks.length}</span></div>
        {tasks.length === 0 ? <div className="py-12 text-center"><CalendarDays className="mx-auto text-muted" size={24} /><p className="mt-3 text-sm font-semibold text-secondary">Nothing scheduled.</p><p className="mt-1 text-xs leading-5 text-muted">Drag a Task here to plan this day.</p></div> : <div className="mt-5 space-y-2">{tasks.map((task) => <AgendaTask key={task.id} onOpen={() => onOpenTask(task.id)} task={task} />)}</div>}
    </aside>;
}

function AgendaTask({ onOpen, task }: { onOpen: () => void; task: TaskViewData }) {
    const [processing, setProcessing] = useState(false);
    function complete() { if (!task.canComplete || processing) return; setProcessing(true); router.post(`/tasks/${task.id}/completion`, {}, { preserveScroll: true, onFinish: () => setProcessing(false) }); }
    return <article className="flex items-center gap-2 rounded-xl border border-border-subtle bg-app p-2" draggable onDragStart={(event: DragEvent<HTMLElement>) => event.dataTransfer.setData('application/x-achelife-calendar-task', String(task.id))}>
        <button aria-label={`Complete ${task.title}`} className="focus-ring grid size-9 shrink-0 place-items-center rounded-full text-accent-ink hover:bg-surface-hover disabled:text-muted" disabled={!task.canComplete || processing} onClick={complete} type="button">{task.canComplete ? <Circle size={19} /> : <Check size={18} />}</button>
        <button className="focus-ring min-w-0 flex-1 rounded-lg py-1 text-left" onClick={onOpen} type="button"><span className="block truncate text-sm font-bold">{task.title}</span><span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted"><span className="size-2 rounded-full" style={{ backgroundColor: task.projectColor ?? 'var(--task-accent)' }} /><FolderKanban size={12} />{task.projectName ?? 'Inbox'}</span></button>
        <GripVertical aria-hidden="true" className="shrink-0 text-muted" size={16} />
    </article>;
}
