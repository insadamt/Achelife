import { router } from '@inertiajs/react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

interface PendingPageSnapshot {
    element: HTMLElement;
    scrollTop: number;
    scope: 'page' | 'tab';
    boundarySelector?: string;
    leavingClassName: string;
    enteringClassName: string;
    durationMs: number;
}

const pageTransitionDurationMs = 260;
const tabTransitionDurationMs = 240;
const navigationPaths = ['/home', '/seasons', '/tasks', '/habits', '/diary', '/constitution', '/money', '/settings'];
const moduleTabPaths: Record<string, string[]> = {
    '/tasks': ['/tasks', '/tasks/calendar', '/tasks/statistics'],
    '/constitution': ['/constitution', '/constitution/archived'],
    '/money': ['/money', '/money/history', '/money/debts', '/money/subscriptions', '/money/organization', '/money/statistics'],
};
const queryTabValues: Record<string, { parameter: string; values: string[]; boundarySelector: string }> = {
    '/settings/general': { parameter: 'section', values: ['appearance', 'profile', 'calendar', 'season', 'data'], boundarySelector: '.page-chrome' },
    '/money/organization': { parameter: 'section', values: ['categories', 'merchants', 'tags'], boundarySelector: '[data-horizontal-nav="organization"]' },
    '/money/subscriptions': { parameter: 'view', values: ['active', 'due', 'paused', 'ended'], boundarySelector: '[data-horizontal-nav="subscription-view"]' },
    '/tasks': { parameter: 'task_view', values: ['today', 'overdue', 'upcoming', 'completed'], boundarySelector: '[data-horizontal-nav="task-view"]' },
    '/tasks/calendar': { parameter: 'view', values: ['month', 'week', 'three_day'], boundarySelector: '[data-horizontal-nav="calendar-view"]' },
};
const transitionClassNames = [
    'page-scroll-entering-up', 'page-scroll-entering-down',
    'page-tab-entering-left', 'page-tab-entering-right',
];

function navigationIndex(pathname: string) {
    return navigationPaths.findIndex((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function scrollDirection(currentPath: string, destinationPath: string): 'up' | 'down' {
    const currentIndex = navigationIndex(currentPath);
    const destinationIndex = navigationIndex(destinationPath);
    return currentIndex >= 0 && destinationIndex >= 0 && destinationIndex < currentIndex ? 'down' : 'up';
}

function queryTabIndex(url: URL, parameter: string, values: string[]): number {
    const value = parameter === 'task_view'
        ? url.searchParams.get('task_view') ?? url.searchParams.get('view') ?? 'today'
        : url.searchParams.get(parameter) ?? values[0];
    return values.indexOf(value);
}

function tabTransition(currentUrl: URL, destinationUrl: URL): { direction: 'left' | 'right'; boundarySelector: string } | null {
    const modulePath = navigationPaths[navigationIndex(currentUrl.pathname)];
    if (!modulePath || modulePath !== navigationPaths[navigationIndex(destinationUrl.pathname)]) return null;

    const tabPaths = moduleTabPaths[modulePath];
    if (currentUrl.pathname !== destinationUrl.pathname) {
        const currentIndex = tabPaths?.indexOf(currentUrl.pathname) ?? -1;
        const destinationIndex = tabPaths?.indexOf(destinationUrl.pathname) ?? -1;
        if (currentIndex < 0 || destinationIndex < 0) return null;
        return { direction: destinationIndex > currentIndex ? 'left' : 'right', boundarySelector: '.page-chrome' };
    }

    const queryTabs = queryTabValues[currentUrl.pathname];
    if (!queryTabs) return null;
    const currentIndex = queryTabIndex(currentUrl, queryTabs.parameter, queryTabs.values);
    const destinationIndex = queryTabIndex(destinationUrl, queryTabs.parameter, queryTabs.values);
    if (currentIndex < 0 || destinationIndex < 0 || currentIndex === destinationIndex) return null;
    return { direction: destinationIndex > currentIndex ? 'left' : 'right', boundarySelector: queryTabs.boundarySelector };
}

function transitionFor(currentUrl: URL, destinationUrl: URL, fromPrimaryNavigation: boolean) {
    if (fromPrimaryNavigation) {
        if (currentUrl.pathname === destinationUrl.pathname) return null;
        const verticalDirection = scrollDirection(currentUrl.pathname, destinationUrl.pathname);
        return {
            scope: 'page' as const,
            leavingClassName: `page-scroll-leaving-${verticalDirection}`,
            enteringClassName: `page-scroll-entering-${verticalDirection}`,
            durationMs: pageTransitionDurationMs,
        };
    }
    const tab = tabTransition(currentUrl, destinationUrl);
    if (tab) {
        return {
            scope: 'tab' as const,
            boundarySelector: tab.boundarySelector,
            leavingClassName: `page-tab-leaving-${tab.direction}`,
            enteringClassName: `page-tab-entering-${tab.direction}`,
            durationMs: tabTransitionDurationMs,
        };
    }
    return null;
}

export function useWorkspacePageTransition(pageUrl: string) {
    const mainRef = useRef<HTMLElement>(null);
    const shellRef = useRef<HTMLDivElement>(null);
    const pendingSnapshotRef = useRef<PendingPageSnapshot | null>(null);
    const activeSnapshotRef = useRef<HTMLElement | null>(null);
    const activeBoundaryRef = useRef<HTMLElement | null>(null);
    const animationTimerRef = useRef<number | null>(null);
    const primaryNavigationUrlRef = useRef<string | null>(null);

    const markPrimaryNavigation = useCallback((href: string) => {
        primaryNavigationUrlRef.current = new URL(href, window.location.origin).pathname;
    }, []);

    const prepareSnapshot = useCallback((destinationUrl: string, fromPrimaryNavigation = false) => {
        const main = mainRef.current;
        if (!main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const currentUrl = new URL(window.location.href);
        const nextUrl = new URL(destinationUrl, currentUrl);
        const transition = transitionFor(currentUrl, nextUrl, fromPrimaryNavigation);
        if (!transition) return;

        pendingSnapshotRef.current = {
            element: main.cloneNode(true) as HTMLElement,
            scrollTop: main.scrollTop,
            ...transition,
        };
    }, []);

    useEffect(() => {
        const stopStart = router.on('start', (event) => {
            const destinationUrl = event.detail.visit.url.toString();
            const destinationPath = new URL(destinationUrl, window.location.origin).pathname;
            const fromPrimaryNavigation = primaryNavigationUrlRef.current === destinationPath;
            primaryNavigationUrlRef.current = null;
            if (event.detail.visit.method === 'get') prepareSnapshot(destinationUrl, fromPrimaryNavigation);
        });
        const stopBeforeUpdate = router.on('beforeUpdate', (event) => {
            if (!pendingSnapshotRef.current) prepareSnapshot(event.detail.page.url);
        });
        const stopCancel = router.on('cancel', () => { pendingSnapshotRef.current = null; });
        return () => {
            stopStart();
            stopBeforeUpdate();
            stopCancel();
        };
    }, [prepareSnapshot]);

    useLayoutEffect(() => {
        const pendingSnapshot = pendingSnapshotRef.current;
        const main = mainRef.current;
        const shell = shellRef.current;
        if (!pendingSnapshot || !main || !shell) return;

        if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current);
        activeSnapshotRef.current?.remove();
        activeBoundaryRef.current?.removeAttribute('data-page-transition-anchor');
        activeBoundaryRef.current = null;
        main.classList.remove(...transitionClassNames);
        main.style.removeProperty('--page-tab-distance');

        const bounds = main.getBoundingClientRect();
        const snapshot = pendingSnapshot.element;
        snapshot.removeAttribute('scroll-region');
        snapshot.removeAttribute('tabindex');
        snapshot.setAttribute('aria-hidden', 'true');
        snapshot.inert = true;
        snapshot.style.position = 'fixed';
        snapshot.style.top = `${bounds.top}px`;
        snapshot.style.left = `${bounds.left}px`;
        snapshot.style.marginLeft = '0';
        snapshot.style.width = `${bounds.width}px`;
        snapshot.style.height = `${bounds.height}px`;
        snapshot.style.zIndex = '10';
        snapshot.style.pointerEvents = 'none';
        snapshot.style.overflow = 'hidden';
        if (pendingSnapshot.scope === 'tab') {
            const slideDistance = `${bounds.width}px`;
            main.style.setProperty('--page-tab-distance', slideDistance);
            snapshot.style.setProperty('--page-tab-distance', slideDistance);
        }
        shell.append(snapshot);
        snapshot.scrollTop = pendingSnapshot.scrollTop;
        if (pendingSnapshot.boundarySelector) {
            const previousBoundary = snapshot.querySelector<HTMLElement>(pendingSnapshot.boundarySelector);
            const nextBoundary = main.querySelector<HTMLElement>(pendingSnapshot.boundarySelector);
            if (previousBoundary && nextBoundary) {
                const clipTop = Math.max(0, previousBoundary.getBoundingClientRect().bottom - bounds.top);
                snapshot.style.clipPath = `inset(${clipTop}px 0 0 0)`;
                previousBoundary.setAttribute('data-page-transition-anchor', '');
                nextBoundary.setAttribute('data-page-transition-anchor', '');
                activeBoundaryRef.current = nextBoundary;
            }
        }
        snapshot.classList.add(pendingSnapshot.leavingClassName);
        activeSnapshotRef.current = snapshot;
        pendingSnapshotRef.current = null;

        const enteringClassName = pendingSnapshot.enteringClassName;
        main.classList.add(enteringClassName);
        animationTimerRef.current = window.setTimeout(() => {
            snapshot.remove();
            if (activeSnapshotRef.current === snapshot) activeSnapshotRef.current = null;
            activeBoundaryRef.current?.removeAttribute('data-page-transition-anchor');
            activeBoundaryRef.current = null;
            main.classList.remove(enteringClassName);
            main.style.removeProperty('--page-tab-distance');
            animationTimerRef.current = null;
        }, pendingSnapshot.durationMs);
    }, [pageUrl]);

    useEffect(() => () => {
        if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current);
        activeSnapshotRef.current?.remove();
        activeBoundaryRef.current?.removeAttribute('data-page-transition-anchor');
        mainRef.current?.classList.remove(...transitionClassNames);
        mainRef.current?.style.removeProperty('--page-tab-distance');
    }, []);

    return { mainRef, shellRef, markPrimaryNavigation };
}
