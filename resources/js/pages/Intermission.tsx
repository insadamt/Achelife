import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Coffee, History, Play } from 'lucide-react';

import { Button, Surface } from '../components/ui';
import type { SeasonViewData } from '../features/seasons/types';
import { MoneySubscriptionSummary } from '../features/money/MoneySubscriptionSummary';
import type { MoneySubscriptionOccurrenceData } from '../features/money/types';
import { SeasonCloseoutPanel } from '../features/seasons/SeasonCloseoutPanel';
import type { SeasonCloseoutData } from '../features/seasons/closeoutTypes';

interface IntermissionCycle {
    nextSeasonNumber: number;
    intermission: {
        reasonLabel: string;
        startedOn: string;
        elapsedRestDays: number;
        proposedStartDate: string;
        proposedEndDate: string;
    };
}

export default function Intermission({ cycle, lastSeason, closeout, manualSubscriptionPayments }: { cycle: IntermissionCycle; lastSeason: SeasonViewData; closeout: SeasonCloseoutData; manualSubscriptionPayments: MoneySubscriptionOccurrenceData[] }) {
    function startSeason() {
        const confirmed = window.confirm(
            `Start Season ${cycle.nextSeasonNumber} on ${cycle.intermission.proposedStartDate}? It will end on ${cycle.intermission.proposedEndDate}.`,
        );

        if (confirmed) router.post('/seasons/start');
    }

    return (
        <div className="mx-auto max-w-4xl">
            <Head title="Season intermission" />

            <Surface className="overflow-hidden p-6 sm:p-9" elevated>
                <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                    <div className="max-w-2xl">
                        <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--season-accent)_12%,transparent)] text-[var(--season-accent)]">
                            <Coffee aria-hidden="true" size={23} />
                        </span>
                        <p className="mt-6 text-xs font-bold tracking-[0.18em] text-[var(--season-accent)] uppercase">Intermission · {cycle.intermission.reasonLabel}</p>
                        <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-6xl">Your next Season is waiting.</h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-secondary">
                            You have rested for {cycle.intermission.elapsedRestDays} {cycle.intermission.elapsedRestDays === 1 ? 'day' : 'days'}. Money, settings, planning, and your history remain available; seasonal rewards resume when you start again.
                        </p>
                    </div>

                    <div className="w-full rounded-[1.75rem] border border-border-subtle bg-app/60 p-5 md:max-w-sm">
                        <p className="text-xs font-bold tracking-[0.14em] text-muted uppercase">Season {cycle.nextSeasonNumber}</p>
                        <div className="mt-4 flex items-start gap-3">
                            <CalendarDays aria-hidden="true" className="mt-0.5 text-[var(--season-accent)]" size={19} />
                            <div>
                                <p className="font-semibold">{cycle.intermission.proposedStartDate}</p>
                                <p className="mt-1 text-sm text-muted">through {cycle.intermission.proposedEndDate}</p>
                            </div>
                        </div>
                        <Button className="mt-6" fullWidth onClick={startSeason}>
                            <Play aria-hidden="true" size={17} />
                            Start Season {cycle.nextSeasonNumber}
                        </Button>
                    </div>
                </div>
            </Surface>

            <MoneySubscriptionSummary due={manualSubscriptionPayments} title="Manual payments due" />

            <section className="mt-8">
                <SeasonCloseoutPanel closeout={closeout} intermission />
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link className="focus-ring rounded-3xl border border-border-subtle bg-surface p-5 hover:bg-surface-hover" href="/seasons">
                    <History aria-hidden="true" className="text-[var(--season-accent)]" size={20} />
                    <p className="mt-4 font-bold">Last closeout</p>
                    <p className="mt-1 text-sm text-muted">Season {lastSeason.number} · {lastSeason.rank?.displayName} · {lastSeason.seasonPoints} SP</p>
                </Link>
                <Link className="focus-ring rounded-3xl border border-border-subtle bg-surface p-5 hover:bg-surface-hover" href="/tasks">
                    <CalendarDays aria-hidden="true" className="text-[var(--season-accent)]" size={20} />
                    <p className="mt-4 font-bold">Plan ahead</p>
                    <p className="mt-1 text-sm text-muted">Create and reschedule Tasks without earning SP.</p>
                </Link>
            </section>
        </div>
    );
}
