import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

type SlideDirection = 'left' | 'right';

const transitionDurationMs = 240;

export function useHorizontalTabTransition<Value extends string>(
    activeTab: Value,
    tabOrder: readonly Value[],
    onChange: (tab: Value) => void,
) {
    const shellRef = useRef<HTMLDivElement>(null);
    const panelElementRef = useRef<HTMLElement>(null);
    const panelRef = useCallback((element: HTMLElement | null) => { panelElementRef.current = element; }, []);
    const pendingDirectionRef = useRef<SlideDirection | null>(null);
    const cloneRef = useRef<HTMLElement | null>(null);
    const timerRef = useRef<number | null>(null);

    const finishTransition = useCallback(() => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = null;
        cloneRef.current?.remove();
        cloneRef.current = null;
        panelElementRef.current?.classList.remove('tab-slide-in-left', 'tab-slide-in-right');
        shellRef.current?.classList.remove('tab-slide-shell');
        if (shellRef.current) shellRef.current.style.minHeight = '';
    }, []);

    const selectTab = useCallback((nextTab: Value) => {
        if (nextTab === activeTab) return;

        const currentIndex = tabOrder.indexOf(activeTab);
        const nextIndex = tabOrder.indexOf(nextTab);
        const shell = shellRef.current;
        const panel = panelElementRef.current;
        finishTransition();

        if (currentIndex < 0 || nextIndex < 0 || !shell || !panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            onChange(nextTab);
            return;
        }

        const direction: SlideDirection = nextIndex > currentIndex ? 'left' : 'right';
        const panelBounds = panel.getBoundingClientRect();
        const shellBounds = shell.getBoundingClientRect();
        const clone = panel.cloneNode(true) as HTMLElement;
        clone.setAttribute('aria-hidden', 'true');
        clone.inert = true;
        clone.style.position = 'absolute';
        clone.style.left = `${panelBounds.left - shellBounds.left}px`;
        clone.style.top = `${panelBounds.top - shellBounds.top}px`;
        clone.style.width = `${panelBounds.width}px`;
        clone.style.height = `${panelBounds.height}px`;
        clone.style.margin = '0';
        clone.style.pointerEvents = 'none';
        clone.style.zIndex = '20';

        shell.style.minHeight = `${shellBounds.height}px`;
        shell.classList.add('tab-slide-shell');
        clone.classList.add(`tab-slide-out-${direction}`);
        shell.append(clone);
        cloneRef.current = clone;
        pendingDirectionRef.current = direction;
        onChange(nextTab);
    }, [activeTab, finishTransition, onChange, tabOrder]);

    useLayoutEffect(() => {
        const direction = pendingDirectionRef.current;
        const panel = panelElementRef.current;
        if (!direction || !panel) return;

        pendingDirectionRef.current = null;
        panel.classList.add(`tab-slide-in-${direction}`);
        timerRef.current = window.setTimeout(finishTransition, transitionDurationMs);
    }, [activeTab, finishTransition]);

    useEffect(() => finishTransition, [finishTransition]);

    return { panelRef, selectTab, shellRef };
}
