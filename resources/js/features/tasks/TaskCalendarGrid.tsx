import { Repeat2, Star } from 'lucide-react';
import type { DragEvent } from 'react';
import { useState } from 'react';

import { classNames } from '../../components/ui/classNames';
import { calendarGridDates } from './taskCalendar';
import type { TaskViewData } from './types';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TaskCalendarGrid({ month, onOpenTask, onReschedule, onSelectDate, selectedDate, tasks, tasksByDay, today }: {
    month: string;
    onOpenTask: (taskId: number) => void;
    onReschedule: (task: TaskViewData, date: string) => void;
    onSelectDate: (date: string) => void;
    selectedDate: string;
    tasks: TaskViewData[];
    tasksByDay: Map<string, TaskViewData[]>;
    today: string;
}) {
    const [dropDate, setDropDate] = useState<string | null>(null);

    return <section aria-label="Task calendar" className="mt-5 overflow-hidden rounded-2xl border border-border-subtle bg-surface">
        <div className="grid grid-cols-7 border-b border-border-subtle bg-app/60">{weekdays.map((weekday) => <span className="px-2 py-3 text-center text-[0.68rem] font-bold tracking-[0.12em] text-muted uppercase sm:text-xs" key={weekday}>{weekday}</span>)}</div>
        <div className="grid grid-cols-7">{calendarGridDates(month).map((date, index) => date === null ? <div aria-hidden="true" className="min-h-28 border-r border-b border-border-subtle bg-app/35" key={`blank-${index}`} /> : <CalendarDay allTasks={tasks} date={date} dropActive={dropDate === date} key={date} onDropTask={onReschedule} onOpenTask={onOpenTask} onSelect={onSelectDate} selected={date === selectedDate} tasks={tasksByDay.get(date) ?? []} today={date === today} setDropDate={setDropDate} />)}</div>
    </section>;
}

function CalendarDay({ allTasks, date, dropActive, onDropTask, onOpenTask, onSelect, selected, setDropDate, tasks, today }: {
    allTasks: TaskViewData[];
    date: string; dropActive: boolean; onDropTask: (task: TaskViewData, date: string) => void; onOpenTask: (taskId: number) => void; onSelect: (date: string) => void; selected: boolean; setDropDate: (date: string | null) => void; tasks: TaskViewData[]; today: boolean;
}) {
    const visibleTasks = tasks.slice(0, 3);
    return <div className={classNames('group min-h-28 border-r border-b border-border-subtle p-1 transition-colors sm:min-h-36 sm:p-2', selected && 'bg-[color-mix(in_srgb,var(--module-accent)_7%,transparent)]', dropActive && 'bg-[color-mix(in_srgb,var(--module-accent)_16%,transparent)] ring-2 ring-inset ring-[var(--module-accent)]')} onDragLeave={() => setDropDate(null)} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropDate(date); }} onDrop={(event) => { event.preventDefault(); setDropDate(null); const taskId = Number(event.dataTransfer.getData('application/x-achelife-calendar-task')); const task = allTasks.find((candidate) => candidate.id === taskId) ?? null; if (task) onDropTask(task, date); }}>
        <button aria-label={`Show ${date}`} className={classNames('focus-ring grid size-7 place-items-center rounded-full text-xs font-bold', today ? 'bg-[var(--module-accent)] text-accent-foreground' : selected ? 'bg-elevated text-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground')} onClick={() => onSelect(date)} type="button">{Number(date.slice(-2))}</button>
        <div className="mt-1 space-y-1">{visibleTasks.map((task) => <TaskChip key={task.id} onOpen={() => onOpenTask(task.id)} task={task} />)}{tasks.length > 3 && <button className="focus-ring w-full rounded px-1 text-left text-[0.68rem] font-bold text-muted hover:text-foreground" onClick={() => onSelect(date)} type="button">+{tasks.length - 3} more</button>}</div>
    </div>;
}

function TaskChip({ onOpen, task }: { onOpen: () => void; task: TaskViewData }) {
    return <button aria-label={`Open ${task.title}, ${task.projectName ?? 'Inbox'}`} className="focus-ring flex w-full items-center gap-1 rounded-md border-l-2 px-1.5 py-1 text-left text-[0.66rem] font-bold text-secondary hover:bg-surface-hover sm:text-xs" draggable onClick={onOpen} onDragStart={(event: DragEvent<HTMLButtonElement>) => event.dataTransfer.setData('application/x-achelife-calendar-task', String(task.id))} style={{ borderLeftColor: task.projectColor ?? 'var(--task-accent)' }} type="button"><span className="min-w-0 flex-1 truncate">{task.title}</span>{task.important && <Star aria-label="Important" className="shrink-0 text-warning" fill="currentColor" size={11} />}{task.recurrence && <Repeat2 aria-label={task.recurrence.label} className="shrink-0 text-muted" size={11} />}</button>;
}
