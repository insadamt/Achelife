import { Link } from '@inertiajs/react';

interface BrandMarkProps {
    compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
    return (
        <Link
            aria-label="Achelife home"
            className="focus-ring inline-flex items-center gap-3 rounded-lg"
            href="/home"
        >
            <span className="relative grid size-9 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_40%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface-elevated))] text-sm font-black text-accent">
                A
                <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-accent" />
            </span>
            {!compact && <span className="text-lg font-black tracking-[0.16em] text-foreground uppercase">Achelife</span>}
        </Link>
    );
}
