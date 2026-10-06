import { router } from '@inertiajs/react';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import { animateNavigationContent } from '../components/ui/animateNavigationContent';
import type { NavigationDirection } from '../components/ui/animateNavigationContent';

interface PageTransition {
    direction: NavigationDirection;
    boundarySelector?: string;
}

interface PendingPageTransition {
    destination: string;
    transition: PageTransition;
}

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
    return values.indexOf(value ?? '');
}

function taskFilesTransition(currentUrl: URL, destinationUrl: URL): { direction: 'left' | 'right'; boundarySelector: string } | null {
    if (currentUrl.pathname !== '/tasks' || destinationUrl.pathname !== '/tasks') return null;
    if (currentUrl.searchParams.has('search') || destinationUrl.searchParams.has('search')) return null;

    const filesViews = ['files', 'archived'];
    const currentIndex = filesViews.indexOf(currentUrl.searchParams.get('view') ?? 'files');
    const destinationIndex = filesViews.indexOf(destinationUrl.searchParams.get('view') ?? 'files');
    if (currentIndex < 0 || destinationIndex < 0 || currentIndex === destinationIndex) return null;

    return {
        direction: destinationIndex > currentIndex ? 'left' : 'right',
        boundarySelector: '[data-horizontal-nav="task-files"]',
    };
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

    const filesTransition = taskFilesTransition(currentUrl, destinationUrl);
    if (filesTransition) return filesTransition;

    const queryTabs = queryTabValues[currentUrl.pathname];
    if (!queryTabs) return null;
    const currentIndex = queryTabIndex(currentUrl, queryTabs.parameter, queryTabs.values);
    const destinationIndex = queryTabIndex(destinationUrl, queryTabs.parameter, queryTabs.values);
    if (currentIndex < 0 || destinationIndex < 0 || currentIndex === destinationIndex) return null;
    return { direction: destinationIndex > currentIndex ? 'left' : 'right', boundarySelector: queryTabs.boundarySelector };
}

function transitionFor(currentUrl: URL, destinationUrl: URL, fromPrimaryNavigation: boolean): PageTransition | null {
    if (fromPrimaryNavigation) {
        if (currentUrl.pathname === destinationUrl.pathname) return null;
        return { direction: scrollDirection(currentUrl.pathname, destinationUrl.pathname) };
    }
    return tabTransition(currentUrl, destinationUrl);
}

function pageDestination(url: URL) {
    return url.pathname + url.search;
}

function contentBelowNavigation(main: HTMLElement, boundarySelector: string): HTMLElement[] {
    const boundary = main.querySelector<HTMLElement>(boundarySelector);
    const elements: HTMLElement[] = [];
    let sibling = boundary?.nextElementSibling;
    while (sibling) {
        if (sibling instanceof HTMLElement) elements.push(sibling);
        sibling = sibling.nextElementSibling;
    }
    return elements;
}

export function useWorkspacePageTransition(pageUrl: string) {
    const mainRef = useRef<HTMLElement>(null);
    const currentPageUrlRef = useRef(pageUrl);
    const pendingTransitionRef = useRef<PendingPageTransition | null>(null);
    const finishAnimationRef = useRef<(() => void) | null>(null);
    const primaryNavigationUrlRef = useRef<string | null>(null);
    const visitingPrimaryPathRef = useRef<string | null>(null);

    const finishTransition = useCallback(() => {
        finishAnimationRef.current?.();
        finishAnimationRef.current = null;
    }, []);

    const markPrimaryNavigation = useCallback((href: string) => {
        primaryNavigationUrlRef.current = new URL(href, window.location.origin).pathname;
    }, []);

    const prepareTransition = useCallback((destinationUrl: string, fromPrimaryNavigation = false) => {
        pendingTransitionRef.current = null;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const currentUrl = new URL(currentPageUrlRef.current, window.location.origin);
        const nextUrl = new URL(destinationUrl, currentUrl);
        const transition = transitionFor(currentUrl, nextUrl, fromPrimaryNavigation);
        if (transition) pendingTransitionRef.current = { destination: pageDestination(nextUrl), transition };
    }, []);

    useEffect(() => {
        const stopStart = router.on('start', (event) => {
            finishTransition();
            pendingTransitionRef.current = null;
            const destinationUrl = event.detail.visit.url.toString();
            const destinationPath = new URL(destinationUrl, window.location.origin).pathname;
            visitingPrimaryPathRef.current = event.detail.visit.method === 'get' && primaryNavigationUrlRef.current === destinationPath
                ? destinationPath : null;
            primaryNavigationUrlRef.current = null;
        });
        const stopBeforeUpdate = router.on('beforeUpdate', (event) => {
            const destinationUrl = event.detail.page.url;
            const destinationPath = new URL(destinationUrl, window.location.origin).pathname;
            prepareTransition(destinationUrl, visitingPrimaryPathRef.current === destinationPath);
            visitingPrimaryPathRef.current = null;
        });
        const clearPendingTransition = () => {
            pendingTransitionRef.current = null;
            visitingPrimaryPathRef.current = null;
        };
        const stopCancel = router.on('cancel', clearPendingTransition);
        const stopError = router.on('error', clearPendingTransition);
        const stopFinish = router.on('finish', () => { visitingPrimaryPathRef.current = null; });
        return () => {
            stopStart();
            stopBeforeUpdate();
            stopCancel();
            stopError();
            stopFinish();
        };
    }, [finishTransition, prepareTransition]);

    useLayoutEffect(() => {
        currentPageUrlRef.current = pageUrl;
        finishTransition();
        const pending = pendingTransitionRef.current;
        pendingTransitionRef.current = null;
        const main = mainRef.current;
        if (!pending || !main || pending.destination !== pageDestination(new URL(pageUrl, window.location.origin))) return;

        const { transition } = pending;
        const elements = transition.boundarySelector ? contentBelowNavigation(main, transition.boundarySelector) : [main];
        finishAnimationRef.current = animateNavigationContent({ container: main, elements, direction: transition.direction });
    }, [pageUrl, finishTransition]);

    useEffect(() => finishTransition, [finishTransition]);

    return { mainRef, markPrimaryNavigation };
}
