import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const previousSelection = new Map<string, string>();

interface IndicatorPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function SlidingNavigationIndicator({ active, containerRef, group, className = '' }: {
    active: string;
    containerRef: RefObject<HTMLElement | null>;
    group: string;
    className?: string;
}) {
    const indicatorRef = useRef<HTMLSpanElement>(null);
    const observedActiveRef = useRef<string | null>(null);
    const originSelectionRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        const container = containerRef.current;
        const indicator = indicatorRef.current;
        if (!container || !indicator) return;

        const items = Array.from(container.querySelectorAll<HTMLElement>('[data-nav-value]'));
        const selectedItem = items.find((item) => item.dataset.navValue === active);
        if (!selectedItem) return;

        const positionOf = (item: HTMLElement): IndicatorPosition => {
            const containerBounds = container.getBoundingClientRect();
            const itemBounds = item.getBoundingClientRect();
            return {
                x: itemBounds.left - containerBounds.left + container.scrollLeft,
                y: itemBounds.top - containerBounds.top + container.scrollTop,
                width: itemBounds.width,
                height: itemBounds.height,
            };
        };

        const placeIndicator = (position: IndicatorPosition) => {
            indicator.style.transform = `translate(${position.x}px, ${position.y}px)`;
            indicator.style.width = `${position.width}px`;
            indicator.style.height = `${position.height}px`;
        };

        if (observedActiveRef.current !== active) {
            originSelectionRef.current = previousSelection.get(group);
            observedActiveRef.current = active;
        }
        const previousItem = items.find((item) => item.dataset.navValue === originSelectionRef.current);
        const destination = positionOf(selectedItem);
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        indicator.style.transition = 'none';
        if (previousItem && previousItem !== selectedItem && !reducedMotion.matches) {
            placeIndicator(positionOf(previousItem));
            indicator.getBoundingClientRect();
            indicator.style.transition = 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), width 280ms cubic-bezier(0.22, 1, 0.36, 1), height 280ms cubic-bezier(0.22, 1, 0.36, 1)';
        }
        placeIndicator(destination);

        previousSelection.set(group, active);
        let observing = true;
        const refreshPosition = () => {
            if (observing) placeIndicator(positionOf(selectedItem));
        };
        const resizeObserver = new ResizeObserver(refreshPosition);
        resizeObserver.observe(container);
        items.forEach((item) => resizeObserver.observe(item));
        void document.fonts.ready.then(refreshPosition);
        const stopForReducedMotion = () => {
            if (reducedMotion.matches) {
                indicator.style.transition = 'none';
                placeIndicator(positionOf(selectedItem));
            }
        };
        reducedMotion.addEventListener('change', stopForReducedMotion);
        return () => {
            observing = false;
            resizeObserver.disconnect();
            reducedMotion.removeEventListener('change', stopForReducedMotion);
        };
    }, [active, containerRef, group]);

    return <span aria-hidden="true" className={`pointer-events-none absolute top-0 left-0 z-0 rounded-xl bg-elevated shadow-sm ${className}`} ref={indicatorRef} />;
}
