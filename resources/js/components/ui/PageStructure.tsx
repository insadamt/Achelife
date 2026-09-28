import { Link } from '@inertiajs/react';
import { useRef } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';

import { classNames } from './classNames';
import { SlidingNavigationIndicator } from './SlidingNavigationIndicator';

export function PageRail({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={classNames('page-rail mx-auto w-full min-w-0 max-w-[80rem]', className)} {...props}>{children}</div>;
}

export function PageChrome({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={classNames('page-chrome', className)}>{children}</div>;
}

interface PageHeaderProps {
    title: string;
    action?: ReactNode;
    className?: string;
}

export function PageHeader({ title, action, className }: PageHeaderProps) {
    return (
        <header className={classNames('page-header flex min-w-0 items-center gap-4', className)}>
            <h1 className="min-w-0 break-words text-[2rem] leading-[1.1] font-bold tracking-[-0.04em] sm:text-[2.5rem]">{title}</h1>
            {action && <div className="min-w-0 shrink-0">{action}</div>}
        </header>
    );
}

export interface ModuleDestination<Value extends string> {
    value: Value;
    label: string;
    href: string;
    icon?: ReactNode;
    count?: number;
}

export function ModuleNavigation<Value extends string>({ label, items, active, className, indicatorGroup }: {
    label: string;
    items: ModuleDestination<Value>[];
    active: Value;
    className?: string;
    indicatorGroup?: string;
}) {
    const navigationRef = useRef<HTMLElement>(null);
    return (
        <nav aria-label={label} className={classNames('module-navigation relative flex max-w-full gap-1 overflow-x-auto rounded-2xl p-1 [scrollbar-width:thin]', className)} ref={navigationRef}>
            {indicatorGroup && <SlidingNavigationIndicator active={active} containerRef={navigationRef} group={indicatorGroup} />}
            {items.map((item) => (
                <Link
                    aria-current={active === item.value ? 'page' : undefined}
                    className={classNames(
                        'focus-ring icon-text relative z-10 flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors duration-200',
                        active === item.value ? (indicatorGroup ? 'text-foreground' : 'bg-elevated text-foreground shadow-sm') : 'text-secondary hover:bg-surface-hover hover:text-foreground',
                    )}
                    data-nav-value={item.value}
                    href={item.href}
                    key={item.value}
                >
                    {item.icon}
                    {item.label}
                    {item.count !== undefined && <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs text-secondary">{item.count}</span>}
                </Link>
            ))}
        </nav>
    );
}

export interface LocalView<Value extends string> {
    value: Value;
    label: string;
    count?: number;
    icon?: ReactNode;
}

export function LocalViewTabs<Value extends string>({ label, views, active, onChange, idPrefix, className }: {
    label: string;
    views: LocalView<Value>[];
    active: Value;
    onChange: (view: Value) => void;
    idPrefix: string;
    className?: string;
}) {
    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        const nextIndex = event.key === 'ArrowRight' ? (index + 1) % views.length
            : event.key === 'ArrowLeft' ? (index - 1 + views.length) % views.length
                : event.key === 'Home' ? 0
                    : event.key === 'End' ? views.length - 1 : null;
        if (nextIndex === null) return;
        event.preventDefault();
        const next = views[nextIndex];
        if (!next) return;
        onChange(next.value);
        event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
    }

    return (
        <div aria-label={label} className={classNames('flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-border-subtle bg-inset p-1', className)} role="tablist">
            {views.map((view, index) => {
                const selected = active === view.value;
                return (
                    <button
                        aria-controls={`${idPrefix}-${view.value}-panel`}
                        aria-selected={selected}
                        className={classNames(
                            'focus-ring icon-text flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-[background-color,color,box-shadow] duration-200',
                            selected ? 'bg-elevated text-foreground shadow-sm' : 'text-secondary hover:bg-surface-hover hover:text-foreground',
                        )}
                        id={`${idPrefix}-${view.value}-tab`}
                        key={view.value}
                        onClick={() => onChange(view.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        role="tab"
                        tabIndex={selected ? 0 : -1}
                        type="button"
                    >
                        {view.icon}
                        <span>{view.label}</span>
                        {view.count !== undefined && <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs text-secondary">{view.count}</span>}
                    </button>
                );
            })}
        </div>
    );
}

export function FilterGroup({ children, label, className }: HTMLAttributes<HTMLDivElement> & { label: string }) {
    return <div aria-label={label} className={classNames('flex flex-wrap items-center gap-3', className)} role="group">{children}</div>;
}
