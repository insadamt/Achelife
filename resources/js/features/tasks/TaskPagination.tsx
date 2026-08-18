import { Link } from '@inertiajs/react';

import type { PaginationLink } from './types';

export function TaskPagination({ links, label }: { links: PaginationLink[]; label: string }) {
    return (
        <nav aria-label={label} className="flex flex-wrap justify-center gap-2 pt-4">
            {links.map((link, index) => link.url ? (
                <Link
                    className={`focus-ring rounded-full border px-3 py-2 text-xs font-bold ${link.active ? 'border-[var(--module-accent)] bg-[var(--module-accent)] text-accent-foreground' : 'border-border-strong text-secondary hover:text-foreground'}`}
                    href={link.url}
                    key={`${link.label}-${index}`}
                    preserveScroll
                >
                    {link.label.replace('&laquo;', '').replace('&raquo;', '')}
                </Link>
            ) : null)}
        </nav>
    );
}
