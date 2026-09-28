import { useState } from 'react';
import type { AnimationEvent, HTMLAttributes, Ref } from 'react';

import { classNames } from './classNames';

interface PopupProps extends HTMLAttributes<HTMLDivElement> {
    open: boolean;
    containerRef?: Ref<HTMLDivElement>;
}

export function Popup({ open, className, containerRef, onAnimationEnd, ...props }: PopupProps) {
    const [presence, setPresence] = useState({ requestedOpen: open, mounted: open, closing: false });

    if (presence.requestedOpen !== open) {
        setPresence({ requestedOpen: open, mounted: true, closing: !open });
    }

    if (!presence.mounted) return null;

    function finishAnimation(event: AnimationEvent<HTMLDivElement>) {
        if (event.target === event.currentTarget && event.animationName === 'popup-exit') {
            setPresence((current) => current.requestedOpen ? current : { ...current, mounted: false, closing: false });
        }
        onAnimationEnd?.(event);
    }

    return (
        <div
            {...props}
            aria-hidden={presence.closing || undefined}
            className={classNames(className, presence.closing ? 'popup-exit pointer-events-none' : 'popup-enter')}
            inert={presence.closing}
            onAnimationEnd={finishAnimation}
            ref={containerRef}
        />
    );
}
