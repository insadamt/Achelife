import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { classNames } from '../../components/ui/classNames';

export interface MoneyFloatingAction {
    icon: LucideIcon;
    label: string;
    href?: string;
    onSelect?: () => void;
    tone?: 'income' | 'expense' | 'default';
}

export function MoneyFloatingActionMenu({ actions, label = 'Add money activity' }: { actions: MoneyFloatingAction[]; label?: string }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const directAction = actions.length === 1 ? actions[0] : null;

    useEffect(() => {
        if (!open) return;

        function closeOnOutsideInteraction(event: PointerEvent) {
            if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
        }

        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        document.addEventListener('pointerdown', closeOnOutsideInteraction);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOnOutsideInteraction);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    return (
        <div className="fixed right-4 bottom-24 z-40 flex flex-col items-end gap-2 md:right-6 md:bottom-6" ref={menuRef}>
            {open && (
                <div className="flex min-w-52 flex-col gap-1 rounded-2xl border border-border-strong bg-elevated p-2 shadow-2xl" role="menu">
                    {actions.map((action) => {
                        const ActionIcon = action.icon;
                        const className = classNames(
                            'focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold hover:bg-surface-hover',
                            action.tone === 'income' && 'text-success',
                            action.tone === 'expense' && 'text-danger',
                        );
                        const content = <><span className="grid size-9 place-items-center rounded-xl bg-app"><ActionIcon aria-hidden="true" size={17} /></span><span>{action.label}</span></>;

                        if (action.href) return <Link className={className} href={action.href} key={action.label} onClick={() => setOpen(false)} role="menuitem">{content}</Link>;
                        return <button className={className} key={action.label} onClick={() => { setOpen(false); action.onSelect?.(); }} role="menuitem" type="button">{content}</button>;
                    })}
                </div>
            )}
            <button
                aria-expanded={directAction ? undefined : open}
                aria-haspopup={directAction ? undefined : 'menu'}
                aria-label={directAction?.label ?? (open ? 'Close quick actions' : label)}
                className="focus-ring accent-background flex min-h-14 items-center gap-2 rounded-full border border-transparent px-5 text-sm font-bold shadow-[0_14px_38px_rgba(0,0,0,0.38)] transition-transform hover:-translate-y-0.5"
                onClick={() => {
                    if (directAction?.onSelect) directAction.onSelect();
                    else setOpen((value) => !value);
                }}
                type="button"
            >
                <Plus aria-hidden="true" className={classNames('transition-transform', open && 'rotate-45')} size={20} />
                {directAction?.label ?? 'Add'}
            </button>
        </div>
    );
}
