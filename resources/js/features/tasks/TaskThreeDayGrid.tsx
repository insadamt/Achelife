import { FolderKanban, Repeat2, Star } from 'lucide-react';
import type { DragEvent } from 'react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { shiftDays } from './taskCalendar';
import type { TaskViewData } from './types';
import { useCalendarTaskRearrangement } from './useCalendarTaskRearrangement';

export function TaskThreeDayGrid({ arrivedTaskId, leavingTaskId, onDragTaskEnd, onDragTaskStart, onOpenTask, onReschedule, onSelectDate, selectedDate, tasks, tasksByDay, threeDayStart, today }: {
    arrivedTaskId: number | null;
    leavingTaskId: number | null;
    onDragTaskEnd: () => void;
    onDragTaskStart: (taskId: number) => void;
    onOpenTask: (taskId: number) => void;
    onReschedule: (task: TaskViewData, date: string) => void;
    onSelectDate: (date: string) => void;
    selectedDate: string;
    tasks: TaskViewData[];
    tasksByDay: Map<string, TaskViewData[]>;
    threeDayStart: string;
    today: string;
}) {
    const [dropDate, setDropDate] = useState<string | null>(null);
    const dates = [threeDayStart, shiftDays(threeDayStart, 1), shiftDays(threeDayStart, 2)];

    return <section aria-label="Three-day task planner" className="mt-5 overflow-hidden rounded-2xl border border-border-subtle bg-surface">
        <div className="grid grid-cols-3">{dates.map((date) => <ThreeDayColumn allTasks={tasks} arrivedTaskId={arrivedTaskId} date={date} dropActive={dropDate === date} key={date} leavingTaskId={leavingTaskId} onDragTaskEnd={onDragTaskEnd} onDragTaskStart={onDragTaskStart} onOpenTask={onOpenTask} onReschedule={onReschedule} onSelectDate={onSelectDate} selected={date === selectedDate} setDropDate={setDropDate} tasks={tasksByDay.get(date) ?? []} today={date === today} />)}</div>
    </section>;
}

function ThreeDayColumn({ allTasks, arrivedTaskId, date, dropActive, leavingTaskId, onDragTaskEnd, onDragTaskStart, onOpenTask, onReschedule, onSelectDate, selected, setDropDate, tasks, today }: {
    allTasks: TaskViewData[]; arrivedTaskId: number | null; date: string; dropActive: boolean; leavingTaskId: number | null; onDragTaskEnd: () => void; onDragTaskStart: (taskId: number) => void; onOpenTask: (taskId: number) => void; onReschedule: (task: TaskViewData, date: string) => void; onSelectDate: (date: string) => void; selected: boolean; setDropDate: (date: string | null) => void; tasks: TaskViewData[]; today: boolean;
}) {
    const taskListRef = useCalendarTaskRearrangement(tasks);
    const formattedDate = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));

    return <div className={classNames('min-h-[24rem] border-r border-border-subtle p-2 last:border-r-0 transition-colors sm:p-3', selected && 'bg-[color-mix(in_srgb,var(--module-accent)_7%,transparent)]', dropActive && 'bg-[color-mix(in_srgb,var(--module-accent)_16%,transparent)] ring-2 ring-inset ring-[var(--module-accent)]')} onDragLeave={() => setDropDate(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropDate(date); }} onDrop={(event) => { event.preventDefault(); setDropDate(null); const taskId = Number(event.dataTransfer.getData('application/x-achelife-calendar-task')); const task = allTasks.find((candidate) => candidate.id === taskId); if (task) onReschedule(task, date); }}>
        <button className={classNames('focus-ring rounded-lg px-1.5 py-1 text-xs font-bold sm:px-2 sm:text-sm', today ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-secondary hover:bg-surface-hover hover:text-foreground')} onClick={() => onSelectDate(date)} type="button">{formattedDate}</button>
        <div className="relative mt-3 space-y-2" ref={taskListRef}>{tasks.map((task) => <ThreeDayTask arriving={task.id === arrivedTaskId} key={task.id} leaving={task.id === leavingTaskId} onDragEnd={onDragTaskEnd} onDragStart={() => onDragTaskStart(task.id)} onOpen={() => onOpenTask(task.id)} task={task} />)}{tasks.length === 0 && <p className="py-10 text-center text-xs font-semibold text-muted">Drop a Task here</p>}</div>
    </div>;
}

function ThreeDayTask({ arriving, leaving, onDragEnd, onDragStart, onOpen, task }: { arriving: boolean; leaving: boolean; onDragEnd: () => void; onDragStart: () => void; onOpen: () => void; task: TaskViewData }) {
    return <button aria-label={`Open ${task.title}, ${task.projectName ?? 'Inbox'}`} className={classNames('focus-ring w-full rounded-xl border border-border-subtle border-l-4 bg-app p-2 text-left hover:bg-surface-hover sm:p-2.5', arriving && 'calendar-task-arrive', leaving && 'calendar-task-leave')} data-calendar-task-id={task.id} draggable onClick={onOpen} onDragEnd={onDragEnd} onDragStart={(event: DragEvent<HTMLButtonElement>) => { event.dataTransfer.setData('application/x-achelife-calendar-task', String(task.id)); event.dataTransfer.effectAllowed = 'move'; event.currentTarget.addEventListener('dragend', onDragEnd, { once: true }); onDragStart(); }} style={{ borderLeftColor: task.projectColor ?? 'var(--task-accent)' }} type="button"><span className="flex items-center gap-1"><span className="min-w-0 flex-1 truncate text-xs font-bold sm:text-sm">{task.title}</span>{task.important && <Star aria-label="Important" className="shrink-0 text-warning" fill="currentColor" size={12} />}{task.recurrence && <Repeat2 aria-label={task.recurrence.label} className="shrink-0 text-muted" size={12} />}</span><span className="mt-1.5 flex min-w-0 items-center gap-1 text-[0.64rem] font-semibold text-muted sm:text-[0.68rem]"><FolderKanban className="shrink-0" size={11} /><span className="truncate">{task.projectName ?? 'Inbox'}</span></span></button>;
}
