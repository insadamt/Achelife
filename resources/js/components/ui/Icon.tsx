import type { SVGProps } from 'react';

export type IconName =
    | 'today'
    | 'seasons'
    | 'tasks'
    | 'habits'
    | 'diary'
    | 'objectives'
    | 'constitution'
    | 'money'
    | 'menu'
    | 'settings'
    | 'logout';

interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
    const commonProps = {
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        strokeWidth: 1.8,
    };

    return (
        <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20" {...props} {...commonProps}>
            {name === 'today' && <path d="M5 4.8h14v14.4H5zM8 3v3.5M16 3v3.5M5 9h14M8.5 13h2M13.5 13h2" />}
            {name === 'seasons' && <path d="M12 3a9 9 0 1 0 9 9c-4.4 1.3-8.3-2.6-7-7A8.7 8.7 0 0 0 12 3Z" />}
            {name === 'tasks' && <path d="m4 7 2 2 3-4M12 7h8M4 15l2 2 3-4M12 15h8" />}
            {name === 'habits' && <path d="M12 21a9 9 0 1 0-9-9M3 4v8h8M8 12a4 4 0 1 0 4-4" />}
            {name === 'diary' && <path d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V3Zm0 15a2 2 0 0 1 2-2h12M9 7h6M9 11h5" />}
            {name === 'objectives' && <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />}
            {name === 'constitution' && <path d="M6 3h9l3 3v15H6zM14 3v4h4M9 11h6M9 15h6" />}
            {name === 'money' && <path d="M4 6h16v12H4zM8 14c1.8 0 1.8-4 0-4m8 0c-1.8 0-1.8 4 0 4M12 15.5v-7M10.5 10h2.3a1.2 1.2 0 0 1 0 2.4h-1.6a1.2 1.2 0 0 0 0 2.4h2.3" />}
            {name === 'menu' && <path d="M4 7h16M4 12h16M4 17h16" />}
            {name === 'settings' && <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12l2-1-2-3.5-2.2.4a7.8 7.8 0 0 0-1.8-1L14.2 5h-4.4L9 6.9a7.8 7.8 0 0 0-1.8 1L5 7.5 3 11l2 1a7.8 7.8 0 0 0 0 2l-2 1 2 3.5 2.2-.4a7.8 7.8 0 0 0 1.8 1l.8 1.9h4.4l.8-1.9a7.8 7.8 0 0 0 1.8-1l2.2.4 2-3.5-2-1a7.8 7.8 0 0 0 0-2Z" />}
            {name === 'logout' && <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />}
        </svg>
    );
}
