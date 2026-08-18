import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { CSSProperties, PropsWithChildren } from 'react';

import { BrandMark } from '../components/BrandMark';
import { Button, Drawer, Icon } from '../components/ui';
import type { IconName } from '../components/ui';
import type { SharedPageProps } from '../types';

interface NavigationDestination {
    label: string;
    icon: IconName;
    href?: string;
}

const destinations: NavigationDestination[] = [
    { label: 'Today', icon: 'today', href: '/home' },
    { label: 'Seasons', icon: 'seasons', href: '/seasons' },
    { label: 'Tasks', icon: 'tasks', href: '/tasks' },
    { label: 'Habits', icon: 'habits' },
    { label: 'Diary', icon: 'diary' },
    { label: 'Objectives', icon: 'objectives' },
    { label: 'Constitution', icon: 'constitution' },
    { label: 'Money', icon: 'money' },
];

const mobilePrimaryLabels = new Set(['Today', 'Seasons', 'Tasks']);

function NavigationItem({
    destination,
    mobile = false,
    rail = false,
}: {
    destination: NavigationDestination;
    mobile?: boolean;
    rail?: boolean;
}) {
    const { url } = usePage();
    const active = destination.href === '/home' ? url === '/home' : destination.href !== undefined && url.startsWith(destination.href);
    const itemClassName = rail
        ? `focus-ring group relative flex size-12 items-center justify-center rounded-2xl transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 ${
              active ? 'bg-[var(--module-accent)] text-accent-foreground' : 'text-muted hover:bg-surface-hover hover:text-foreground'
          }`
        : mobile
          ? `focus-ring relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.625rem] font-bold tracking-[0.06em] uppercase transition-colors duration-200 ${
                active ? 'text-[var(--module-accent)]' : 'text-muted'
            }`
          : `focus-ring group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-[background-color,color] duration-200 ${
                active ? 'bg-[color-mix(in_srgb,var(--module-accent)_10%,transparent)] text-foreground' : 'text-secondary'
            }`;

    const content = (
        <>
            {active && !mobile && !rail && <span className="h-5 w-0.5 rounded-full bg-[var(--module-accent)]" aria-hidden="true" />}
            <Icon className={active && !rail ? 'text-[var(--module-accent)]' : ''} name={destination.icon} />
            {!rail && <span>{destination.label}</span>}
            {!destination.href && !mobile && !rail && <span className="ml-auto text-[0.5625rem] tracking-[0.12em] text-muted uppercase">Soon</span>}
            {rail && (
                <span className="pointer-events-none absolute left-[calc(100%+0.75rem)] z-40 flex min-w-max items-center gap-2 rounded-xl border border-border-subtle bg-elevated px-3 py-2 text-xs font-semibold text-foreground opacity-0 shadow-xl transition-opacity duration-160 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {destination.label}
                    {!destination.href && <span className="text-[0.5625rem] tracking-widest text-muted uppercase">Soon</span>}
                </span>
            )}
            {active && mobile && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-[var(--module-accent)]" />}
        </>
    );

    if (destination.href) {
        return (
            <Link aria-current={active ? 'page' : undefined} className={itemClassName} href={destination.href}>
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

function UserIdentity({ name, email }: { name: string; email: string }) {
    const initial = name.trim().charAt(0).toUpperCase() || 'A';

    return (
        <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border-strong bg-elevated text-sm font-bold text-foreground">
                {initial}
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
                <span className="block truncate text-xs text-muted">{email}</span>
            </span>
        </div>
    );
}

export default function AppLayout({ children }: PropsWithChildren) {
    const page = usePage<SharedPageProps>();
    const { auth } = page.props;
    const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
    const user = auth.user;
    const moduleAccent = page.url.startsWith('/tasks')
        ? 'var(--task-accent)'
        : page.url.startsWith('/seasons')
          ? 'var(--season-accent)'
          : undefined;

    function logOut() {
        router.post('/logout');
    }

    return (
        <div className="min-h-screen bg-app text-foreground" style={{ '--module-accent': moduleAccent } as CSSProperties}>
            <aside className="fixed top-4 bottom-4 left-4 z-30 hidden w-20 rounded-[2rem] border border-border-subtle bg-surface/96 shadow-[0_24px_60px_rgba(0,0,0,0.32)] md:flex md:flex-col">
                <div className="flex justify-center py-4">
                    <BrandMark compact />
                </div>
                <div className="mx-4 border-t border-border-subtle" />
                <nav aria-label="Primary navigation" className="flex flex-1 flex-col items-center gap-1 px-2 py-4">
                    {destinations.map((destination) => (
                        <NavigationItem destination={destination} key={destination.label} rail />
                    ))}
                </nav>
                {user && (
                    <div className="flex flex-col items-center gap-2 border-t border-border-subtle py-4">
                        <span className="grid size-10 place-items-center rounded-full bg-[linear-gradient(145deg,var(--preview-violet),var(--preview-orange))] text-sm font-bold text-white" title={`${user.name} — ${user.email}`}>
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                        <Button aria-label="Log out" className="size-10 px-0" onClick={logOut} size="small" title="Log out" variant="ghost">
                            <Icon name="logout" />
                        </Button>
                    </div>
                )}
            </aside>

            <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-subtle bg-app/92 px-4 backdrop-blur-md md:hidden">
                <BrandMark />
                {user && <span className="grid size-9 place-items-center rounded-xl bg-elevated text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>}
            </header>

            <main className="mx-auto min-h-screen max-w-[92rem] px-4 pt-7 pb-28 sm:px-6 md:ml-28 md:px-8 md:pt-10 md:pb-12 lg:px-12">
                {children}
            </main>

            <nav
                aria-label="Mobile primary navigation"
                className="fixed right-3 bottom-3 left-3 z-30 flex items-center rounded-2xl border border-border-strong bg-elevated/96 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-md md:hidden"
            >
                {destinations.filter((destination) => mobilePrimaryLabels.has(destination.label)).map((destination) => (
                    <NavigationItem destination={destination} key={destination.label} mobile />
                ))}
                <button
                    aria-expanded={mobileNavigationOpen}
                    className="focus-ring flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.625rem] font-bold tracking-[0.06em] text-muted uppercase transition-colors duration-200 hover:text-foreground"
                    onClick={() => setMobileNavigationOpen(true)}
                    type="button"
                >
                    <Icon name="menu" />
                    More
                </button>
            </nav>

            <Drawer
                description="Additional destinations and account controls. Feature modules unlock in later phases."
                onClose={() => setMobileNavigationOpen(false)}
                open={mobileNavigationOpen}
                title="Navigate"
            >
                <nav aria-label="All destinations" className="space-y-1">
                    {destinations.map((destination) => (
                        <NavigationItem destination={destination} key={destination.label} />
                    ))}
                </nav>
                {user && (
                    <div className="mt-8 border-t border-border-subtle pt-6">
                        <UserIdentity email={user.email} name={user.name} />
                        <Button className="mt-5" fullWidth onClick={logOut} variant="secondary">
                            <Icon name="logout" />
                            Log out
                        </Button>
                    </div>
                )}
            </Drawer>
        </div>
    );
}
