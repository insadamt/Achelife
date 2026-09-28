import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { animateNavigationContent } from './animateNavigationContent';

type SlideDirection = 'left' | 'right';

export function useHorizontalTabTransition<Value extends string>(
    activeTab: Value,
    tabOrder: readonly Value[],
    onChange: (tab: Value) => void,
) {
    const shellRef = useRef<HTMLDivElement>(null);
    const panelElementRef = useRef<HTMLElement>(null);
    const panelRef = useCallback((element: HTMLElement | null) => { panelElementRef.current = element; }, []);
    const pendingDirectionRef = useRef<SlideDirection | null>(null);
    const finishAnimationRef = useRef<(() => void) | null>(null);

    const finishTransition = useCallback(() => {
        finishAnimationRef.current?.();
        finishAnimationRef.current = null;
        pendingDirectionRef.current = null;
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

        pendingDirectionRef.current = nextIndex > currentIndex ? 'left' : 'right';
        onChange(nextTab);
    }, [activeTab, finishTransition, onChange, tabOrder]);

    useLayoutEffect(() => {
        const direction = pendingDirectionRef.current;
        const panel = panelElementRef.current;
        finishTransition();
        if (!direction || !panel || !shellRef.current) return;

        finishAnimationRef.current = animateNavigationContent({ container: shellRef.current, elements: [panel], direction });
    }, [activeTab, finishTransition]);

    useEffect(() => finishTransition, [finishTransition]);

    return { panelRef, selectTab, shellRef };
}
