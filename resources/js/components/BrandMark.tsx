import { Link } from '@inertiajs/react';

import { useTheme } from '../theme/ThemeProvider';

interface BrandMarkProps {
    compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
    const { resolvedTheme } = useTheme();
    const logoSource = resolvedTheme === 'dark' ? '/imgs/logo/achelife_logo_white.png' : '/imgs/logo/achelife_logo_black.png';

    return (
        <Link
            aria-label="Achelife home"
            className="focus-ring inline-flex items-center gap-3 rounded-lg"
            href="/home"
        >
            <img alt="" className="size-11 object-contain" src={logoSource} />
            {!compact && <span className="text-lg font-black tracking-[0.16em] text-foreground uppercase">Achelife</span>}
        </Link>
    );
}
