import { Link, usePage } from '@inertiajs/react';
import { BookOpenText, CalendarDays, CheckCheck, House, Repeat2, ScrollText, Settings2, Timer, Wallet, type LucideIcon } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PropsWithChildren } from 'react';

import { BrandMark } from '../components/BrandMark';
import { ThemeToggle } from '../components/ThemeToggle';
import { Drawer, Icon } from '../components/ui';
import { classNames } from '../components/ui/classNames';
import { ProgressNotch } from '../features/progress/ProgressNotch';
import { SpGainProvider, useSpGain } from '../features/progress/SpGainContext';
import { DynamicIsland } from '../features/focus/DynamicIsland';
import { FocusTimerProvider, useFocusTimer } from '../features/focus/FocusTimerContext';
import type { SharedPageProps } from '../types';
import { ThemeProvider } from '../theme/ThemeProvider';
import { revealAppearanceFromCenter } from '../theme/appearanceReveal';
import { useWorkspacePageTransition } from './useWorkspacePageTransition';

interface NavigationDestination {
    label: string;
    icon: LucideIcon;
    href?: string;
}

function isActiveDestination(destination: NavigationDestination, url: string) {
    if (!destination.href) return false;
    const pathname = url.split('?')[0];
    if (destination.href === '/settings/general') return pathname.startsWith('/settings/');
    return pathname === destination.href || pathname.startsWith(`${destination.href}/`);
}

const destinations: NavigationDestination[] = [
    { label: 'Today', icon: House, href: '/home' },
    { label: 'Seasons', icon: CalendarDays, href: '/seasons' },
    { label: 'Tasks', icon: CheckCheck, href: '/tasks' },
    { label: 'Habits', icon: Repeat2, href: '/habits' },
    { label: 'Diary', icon: BookOpenText, href: '/diary' },
    { label: 'Constitution', icon: ScrollText, href: '/constitution' },
    { label: 'Money', icon: Wallet, href: '/money' },
];

const mobilePrimaryLabels = new Set(['Today', 'Tasks', 'Habits']);
const settingsDestination: NavigationDestination = { label: 'Settings', icon: Settings2, href: '/settings/general' };

function useSidebarActiveIndicator(url: string) {
    const sidebarRef = useRef<HTMLElement>(null);
    const navigationRef = useRef<HTMLElement>(null);
    const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

    useLayoutEffect(() => {
        const sidebar = sidebarRef.current;
        const navigation = navigationRef.current;
        if (!sidebar || !navigation) return;

        function updateIndicatorPosition() {
            const activeLink = sidebar.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
            if (!activeLink || sidebar.getClientRects().length === 0) {
                setIndicatorTop(null);
                return;
            }

            const linkBounds = activeLink.getBoundingClientRect();
            const sidebarBounds = sidebar.getBoundingClientRect();
            setIndicatorTop(linkBounds.top - sidebarBounds.top + (linkBounds.height - 48) / 2);
        }

        updateIndicatorPosition();
        window.addEventListener('resize', updateIndicatorPosition);
        navigation.addEventListener('scroll', updateIndicatorPosition);
        return () => {
            window.removeEventListener('resize', updateIndicatorPosition);
            navigation.removeEventListener('scroll', updateIndicatorPosition);
        };
    }, [url]);

    return { sidebarRef, navigationRef, indicatorTop };
}

function NavigationItem({
    destination,
    mobile = false,
    rail = false,
    onNavigate,
    onPrimaryNavigate,
}: {
    destination: NavigationDestination;
    mobile?: boolean;
    rail?: boolean;
    onNavigate?: () => void;
    onPrimaryNavigate?: (href: string) => void;
}) {
    const { url } = usePage();
    const active = isActiveDestination(destination, url);
    const DestinationIcon = destination.icon;
    const itemClassName = rail
        ? 'focus-ring group relative flex min-h-12 w-full items-center justify-center rounded-2xl px-2 text-secondary transition-colors duration-200 hover:text-foreground'
        : mobile
          ? `focus-ring icon-text relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.625rem] font-bold tracking-[0.06em] uppercase transition-colors duration-200 ${
                active ? 'bg-[color-mix(in_srgb,var(--module-accent)_16%,transparent)] text-foreground' : 'text-secondary hover:bg-surface-hover'
            }`
          : `focus-ring icon-text group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-[background-color,color] duration-200 ${
                active ? 'bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-foreground' : 'text-secondary'
            }`;

    const content = (
        <>
            {active && !mobile && !rail && <span className="h-5 w-0.5 rounded-full bg-[var(--module-accent)]" aria-hidden="true" />}
            {rail ? (
                <span className={classNames('grid size-9 shrink-0 place-items-center rounded-xl transition-colors duration-200', active && 'text-accent-ink')}>
                    <DestinationIcon aria-hidden="true" size={21} strokeWidth={2} />
                </span>
            ) : <DestinationIcon aria-hidden="true" className={active ? 'text-accent-ink' : ''} size={24} strokeWidth={2} />}
            {!rail && <span>{destination.label}</span>}
            {!destination.href && !mobile && !rail && <span className="ml-auto text-[0.5625rem] tracking-[0.12em] text-muted uppercase">Soon</span>}
            {active && mobile && <span aria-hidden="true" className="absolute bottom-0 h-0.5 w-6 rounded-full bg-[var(--module-accent)]" />}
        </>
    );

    if (destination.href) {
        const href = destination.href;
        return (
            <Link aria-label={rail ? destination.label : undefined} aria-current={active ? 'page' : undefined} className={itemClassName} href={href} title={rail ? destination.label : undefined} onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                onPrimaryNavigate?.(href);
                onNavigate?.();
            }}>
                {content}
            </Link>
        );
    }

    return (
        <button aria-disabled="true" className={`${itemClassName} cursor-not-allowed opacity-55`} disabled type="button">
            {content}
        </button>
    );
}

function UserIdentity({ name }: { name: string }) {
    const initial = name.trim().charAt(0).toUpperCase() || 'A';

    return (
        <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border-strong bg-elevated text-sm font-bold text-foreground">
                {initial}
            </span>
            <span className="block min-w-0 truncate text-sm font-semibold text-foreground">{name}</span>
        </div>
    );
}

function AppShell({ children }: PropsWithChildren) {
    const page = usePage<SharedPageProps>();
    const { mainRef, markPrimaryNavigation } = useWorkspacePageTransition(page.url);
    const { sidebarRef, navigationRef, indicatorTop } = useSidebarActiveIndicator(page.url);
    const { auth } = page.props;
    const { appearance } = page.props;
    const [displayedSurfaceStyle, setDisplayedSurfaceStyle] = useState(appearance.surfaceStyle);
    const [displayedBackgroundUrl, setDisplayedBackgroundUrl] = useState(appearance.backgroundUrl);
    const [revealingBackgroundUrl, setRevealingBackgroundUrl] = useState<string | null | undefined>(undefined);
    const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
    const [mobileFocusVisible, setMobileFocusVisible] = useState(false);
    const mobileFocusTriggerRef = useRef<HTMLButtonElement>(null);
    const user = auth.user;
    const focus = useFocusTimer();
    const spGain = useSpGain();
    const dismissMobileFocus = useCallback(() => setMobileFocusVisible(false), []);
    const wallpaperStyle = displayedBackgroundUrl === null
        ? undefined
        : { '--app-wallpaper': `url("${displayedBackgroundUrl}")` } as CSSProperties;
    const secondaryDestinationActive = [...destinations, settingsDestination].some((destination) =>
        !mobilePrimaryLabels.has(destination.label) && isActiveDestination(destination, page.url),
    );

    useEffect(() => {
        if ((!focus.event && !spGain.event) || !focus.session || !window.matchMedia('(max-width: 767px)').matches) return;
        const frame = window.requestAnimationFrame(() => {
            setMobileFocusVisible(true);
        });
        return () => window.cancelAnimationFrame(frame);
    }, [focus.event, focus.session, spGain.event]);

    useEffect(() => {
        if (appearance.surfaceStyle === displayedSurfaceStyle) return;
        revealAppearanceFromCenter(() => setDisplayedSurfaceStyle(appearance.surfaceStyle));
    }, [appearance.surfaceStyle, displayedSurfaceStyle]);

    useEffect(() => {
        const nextBackgroundUrl = appearance.backgroundUrl;
        if (nextBackgroundUrl === displayedBackgroundUrl) return;

        let cancelled = false;
        const revealBackground = () => {
            if (cancelled) return;
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                setDisplayedBackgroundUrl(nextBackgroundUrl);
            } else {
                setRevealingBackgroundUrl(nextBackgroundUrl);
            }
        };

        if (nextBackgroundUrl === null) {
            revealBackground();
        } else {
            const image = new Image();
            image.src = nextBackgroundUrl;
            void image.decode().catch(() => undefined).then(revealBackground);
        }

        return () => { cancelled = true; };
    }, [appearance.backgroundUrl, displayedBackgroundUrl]);

    function finishBackgroundReveal() {
        if (revealingBackgroundUrl === undefined) return;
        setDisplayedBackgroundUrl(revealingBackgroundUrl);
        setRevealingBackgroundUrl(undefined);
    }

    const revealingBackgroundStyle = revealingBackgroundUrl
        ? { '--reveal-wallpaper': `url("${revealingBackgroundUrl}")` } as CSSProperties
        : undefined;

    return (
        <div
            className={classNames('app-shell h-dvh overflow-hidden bg-app text-foreground', displayedSurfaceStyle === 'glass' && 'app-glass', displayedBackgroundUrl !== null && 'app-wallpaper')}
            style={wallpaperStyle}
        >
            {revealingBackgroundUrl !== undefined && (
                <div
                    aria-hidden="true"
                    className={classNames('app-background-reveal-layer', revealingBackgroundUrl ? 'app-background-reveal-custom' : displayedSurfaceStyle === 'glass' && 'app-background-reveal-default')}
                    onAnimationEnd={finishBackgroundReveal}
                    style={revealingBackgroundStyle}
                />
            )}
            <aside className="fixed top-4 bottom-4 left-4 z-30 hidden w-20 flex-col rounded-[2rem] border border-border-subtle bg-overlay shadow-[var(--shadow-navigation)] md:flex" ref={sidebarRef}>
                {indicatorTop !== null && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 right-2 left-2 h-12 transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                        style={{ transform: `translateY(${indicatorTop}px)` }}
                    >
                        <span className="absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-[var(--module-accent)]" />
                        <span
                            className="absolute top-1/2 left-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-xl"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--module-accent) 22%, transparent)' }}
                        />
                    </div>
                )}
                <div className="flex min-h-19 items-center justify-center px-3">
                    <BrandMark compact large />
                </div>
                <div className="mx-3 border-t border-border-subtle" />
                <nav aria-label="Primary navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 py-4" ref={navigationRef}>
                    {destinations.map((destination) => (
                        <NavigationItem destination={destination} key={destination.label} onPrimaryNavigate={markPrimaryNavigation} rail />
                    ))}
                </nav>
                {user && (
                    <div className="flex shrink-0 flex-col gap-2 border-t border-border-subtle px-2 py-3">
                        <NavigationItem destination={settingsDestination} onPrimaryNavigate={markPrimaryNavigation} rail />
                        <div className="flex justify-center">
                            <ThemeToggle bare />
                        </div>
                        <div className="flex min-w-0 items-center justify-center border-t border-border-subtle px-2 pt-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--module-accent)_24%,var(--surface-elevated))] text-sm font-bold text-foreground">
                                {user.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}
            </aside>

            <header className="relative z-20 flex min-h-16 items-center justify-between border-b border-border-subtle bg-overlay px-4 py-2 shadow-[var(--shadow-panel)] md:hidden">
                <BrandMark />
                {user && (
                    <div className="flex items-center gap-2">
                        {focus.session && (
                            <button
                                aria-expanded={mobileFocusVisible}
                                aria-label={`${mobileFocusVisible ? 'Hide' : 'Show'} Focus Tasks`}
                                className="focus-ring relative grid size-10 place-items-center rounded-xl text-secondary transition-colors hover:bg-surface-hover hover:text-foreground"
                                onClick={() => setMobileFocusVisible((visible) => !visible)}
                                ref={mobileFocusTriggerRef}
                                type="button"
                            >
                                <Timer aria-hidden="true" size={19} />
                                <span className={classNames('absolute top-1.5 right-1.5 size-2 rounded-full', focus.session.running ? 'bg-[var(--task-accent)]' : 'bg-warning')} aria-hidden="true" />
                            </button>
                        )}
                        <ThemeToggle className="size-10 rounded-xl" />
                        <span className="grid size-9 place-items-center rounded-xl bg-elevated text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
            </header>

            <main aria-label="Page content" className="workspace-scroll-region focus-ring h-[calc(100dvh-4rem)] overflow-y-auto px-4 pt-6 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 md:ml-28 md:h-dvh md:px-8 md:pt-10 md:pb-12 lg:ml-24 lg:px-12" ref={mainRef} scroll-region="" tabIndex={0}>
                <div className="mx-auto w-full max-w-[80rem]">{children}</div>
            </main>

            <nav
                aria-label="Mobile primary navigation"
                className="fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-3 z-30 flex items-center rounded-2xl border border-border-strong bg-overlay p-1.5 shadow-[var(--shadow-navigation)] md:hidden"
            >
                {destinations.filter((destination) => mobilePrimaryLabels.has(destination.label)).map((destination) => (
                    <NavigationItem destination={destination} key={destination.label} mobile onPrimaryNavigate={markPrimaryNavigation} />
                ))}
                <button
                    aria-expanded={mobileNavigationOpen}
                    aria-label={secondaryDestinationActive ? 'More navigation, current section' : 'More navigation'}
                    className={classNames('focus-ring icon-text relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.625rem] font-bold tracking-[0.06em] uppercase transition-colors duration-200', secondaryDestinationActive ? 'bg-[color-mix(in_srgb,var(--module-accent)_16%,transparent)] text-foreground' : 'text-secondary hover:bg-surface-hover')}
                    onClick={() => setMobileNavigationOpen(true)}
                    type="button"
                >
                    <Icon name="menu" />
                    More
                    {secondaryDestinationActive && <span aria-hidden="true" className="absolute bottom-0 h-0.5 w-6 rounded-full bg-[var(--module-accent)]" />}
                </button>
            </nav>

            <Drawer
                description="Additional destinations and settings."
                onClose={() => setMobileNavigationOpen(false)}
                open={mobileNavigationOpen}
                title="Navigate"
            >
                <nav aria-label="All destinations" className="space-y-1">
                    {destinations.map((destination) => (
                        <NavigationItem destination={destination} key={destination.label} onNavigate={() => setMobileNavigationOpen(false)} onPrimaryNavigate={markPrimaryNavigation} />
                    ))}
                </nav>
                {user && (
                    <div className="mt-8 border-t border-border-subtle pt-6">
                        <UserIdentity name={user.name} />
                        <div className="mt-5">
                            <NavigationItem destination={settingsDestination} onNavigate={() => setMobileNavigationOpen(false)} onPrimaryNavigate={markPrimaryNavigation} />
                        </div>
                    </div>
                )}
            </Drawer>

            {page.props.progressPanel && <ProgressNotch data={page.props.progressPanel} />}
            <DynamicIsland
                mobileVisible={mobileFocusVisible || Boolean(focus.event && focus.session) || Boolean(spGain.event)}
                mobileTriggerRef={mobileFocusTriggerRef}
                onMobileDismiss={dismissMobileFocus}
                spGain={spGain.event}
            />
            {focus.error && <div className="fixed top-[8.5rem] left-1/2 z-[60] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-danger/30 bg-overlay p-3 text-sm font-semibold text-danger shadow-[var(--shadow-raised)] md:top-20" role="alert">
                {focus.error}
            </div>}
        </div>
    );
}

export default function AppLayout({ children }: PropsWithChildren) {
    return (
        <ThemeProvider>
            <FocusTimerProvider>
                <SpGainProvider>
                    <AppShell>{children}</AppShell>
                </SpGainProvider>
            </FocusTimerProvider>
        </ThemeProvider>
    );
}
