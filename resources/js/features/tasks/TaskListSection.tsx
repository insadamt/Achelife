import type { PropsWithChildren } from 'react';

interface TaskListSectionProps {
    title: string;
    count: number;
    description: string;
    emptyMessage: string;
}

export function TaskListSection({ title, count, description, emptyMessage, children }: PropsWithChildren<TaskListSectionProps>) {
    return (
        <section aria-labelledby={`task-section-${title.toLowerCase()}`} className="border-t border-border-subtle pt-7">
            <header className="mb-4 flex items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold tracking-[0.17em] text-foreground uppercase" id={`task-section-${title.toLowerCase()}`}>{title}</h2>
                        <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-bold text-muted">{count}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{description}</p>
                </div>
            </header>
            {count > 0 ? <div className="space-y-2">{children}</div> : <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-7 text-center text-sm text-muted">{emptyMessage}</p>}
        </section>
    );
}
