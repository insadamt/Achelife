import { Link } from '@inertiajs/react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Filter, Inbox } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { classNames } from '../../components/ui/classNames';
import { calendarHref, monthLabel, shiftMonth } from './taskCalendar';
import type { CalendarProject } from './taskCalendar';

export function TaskCalendarControls({ includeInbox, month, onFiltersChange, projectIds, projects, today }: {
    includeInbox: boolean;
    month: string;
    onFiltersChange: (projectIds: number[], includeInbox: boolean) => void;
    projectIds: number[];
    projects: CalendarProject[];
    today: string;
}) {
    const [filterOpen, setFilterOpen] = useState(false);
    const activeCount = projectIds.length + (includeInbox ? 1 : 0);
    const allSelected = projectIds.length === projects.length && includeInbox;

    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-2 sm:p-3">
            <div className="flex items-center gap-1">
                <Link aria-label="Previous month" className="focus-ring grid size-11 place-items-center rounded-xl text-secondary hover:bg-surface-hover hover:text-foreground" href={calendarHref(shiftMonth(month, -1), `${shiftMonth(month, -1)}-01`, projectIds, includeInbox)}><ChevronLeft size={19} /></Link>
                <div className="min-w-40 px-2 text-center"><p className="text-lg font-bold tracking-[-0.02em]">{monthLabel(month)}</p></div>
                <Link aria-label="Next month" className="focus-ring grid size-11 place-items-center rounded-xl text-secondary hover:bg-surface-hover hover:text-foreground" href={calendarHref(shiftMonth(month, 1), `${shiftMonth(month, 1)}-01`, projectIds, includeInbox)}><ChevronRight size={19} /></Link>
            </div>
            <div className="flex items-center gap-2">
                <Link className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-secondary hover:bg-surface-hover hover:text-foreground" href={calendarHref(today.slice(0, 7), today, projectIds, includeInbox)}><CalendarDays size={16} />Today</Link>
                <div className="relative">
                    <button aria-expanded={filterOpen} className={classNames('focus-ring inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold', filterOpen ? 'border-[var(--module-accent)] bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-foreground' : 'border-border-subtle text-secondary hover:bg-surface-hover hover:text-foreground')} onClick={() => setFilterOpen((open) => !open)} type="button"><Filter size={16} />Projects {!allSelected && <span className="rounded-full bg-elevated px-1.5 py-0.5 text-xs">{activeCount}</span>}</button>
                    {filterOpen && <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-border-strong bg-elevated p-2 shadow-2xl">
                        <button className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-bold hover:bg-surface-hover" onClick={() => onFiltersChange(projects.map((project) => project.id), true)} type="button"><Check className={classNames('text-accent-ink', !allSelected && 'invisible')} size={16} />All Projects</button>
                        <div className="my-1 border-t border-border-subtle" />
                        <FilterOption checked={includeInbox} icon={<Inbox size={16} />} label="Inbox" onClick={() => onFiltersChange(projectIds, !includeInbox)} />
                        {projects.map((project) => <FilterOption checked={projectIds.includes(project.id)} icon={<span className="size-3 rounded-full" style={{ backgroundColor: project.color ?? 'var(--task-accent)' }} />} key={project.id} label={project.name} onClick={() => onFiltersChange(projectIds.includes(project.id) ? projectIds.filter((id) => id !== project.id) : [...projectIds, project.id], includeInbox)} />)}
                    </div>}
                </div>
            </div>
        </div>
    );
}

function FilterOption({ checked, icon, label, onClick }: { checked: boolean; icon: ReactNode; label: string; onClick: () => void }) {
    return <button className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-secondary hover:bg-surface-hover hover:text-foreground" onClick={onClick} type="button"><Check className={classNames('text-accent-ink', !checked && 'invisible')} size={16} />{icon}<span className="truncate">{label}</span></button>;
}
