import { useForm } from '@inertiajs/react';
import { BookOpen, CheckCircle2, Gavel, ListChecks, Repeat2, Target } from 'lucide-react';
import type { FormEvent } from 'react';

import { RankBadge } from '../../components/rank';
import { Button, Surface } from '../../components/ui';
import type { SeasonCloseoutData } from './closeoutTypes';

const breakdownPresentation = [
    { key: 'tasks', label: 'Tasks', icon: ListChecks },
    { key: 'habits', label: 'Habits', icon: Repeat2 },
    { key: 'diary', label: 'Diary', icon: BookOpen },
    { key: 'objectives', label: 'Objectives', icon: Target },
    { key: 'constitution', label: 'Constitution', icon: Gavel },
] as const;

function comparison(current: number, previous: number | undefined, suffix = '') {
    if (previous === undefined) return 'First completed Season';
    const delta = current - previous;
    return delta === 0 ? `Same as last Season${suffix}` : `${delta > 0 ? '+' : ''}${delta}${suffix} vs last Season`;
}

export function SeasonCloseoutPanel({ closeout, intermission = false }: { closeout: SeasonCloseoutData; intermission?: boolean }) {
    const form = useForm({ reflection: closeout.reflection });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/seasons/${closeout.seasonId}/closeout`, { preserveScroll: true });
    }

    return (
        <div className="space-y-6">
            <Surface className="overflow-hidden p-6 sm:p-8" elevated>
                <p className="text-xs font-bold tracking-[0.2em] text-[var(--season-accent)] uppercase">Season {closeout.seasonNumber} complete</p>
                <div className="mt-5 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                    <div><RankBadge rank={closeout.rank} size="hero" /><p className="mt-5 text-sm text-muted">{closeout.startDate} — {closeout.endDate}</p></div>
                    <div className="sm:text-right"><p className="text-6xl font-bold tracking-[-0.06em]">{closeout.seasonPoints}</p><p className="mt-1 text-sm font-bold tracking-wider text-muted uppercase">Final Season SP</p><p className="mt-2 text-sm text-secondary">{comparison(closeout.seasonPoints, closeout.previous?.seasonPoints, ' SP')}</p></div>
                </div>
            </Surface>

            <section>
                <h2 className="text-xl font-bold">Where your SP came from</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {breakdownPresentation.map(({ key, label, icon: Icon }) => (
                        <Surface className="p-4" key={key}><Icon aria-hidden="true" className="text-[var(--season-accent)]" size={19} /><p className="mt-4 text-sm font-semibold text-secondary">{label}</p><p className="mt-1 text-3xl font-bold">{closeout.breakdown[key]} <span className="text-sm text-muted">SP</span></p><p className="mt-2 text-xs text-muted">{comparison(closeout.breakdown[key], closeout.previous?.breakdown[key])}</p></Surface>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold">The Season in practice</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        ['Objectives', `${closeout.metrics.objectivesCompleted} / ${closeout.metrics.objectivesTotal}`, 'completed'],
                        ['Tasks', `${closeout.metrics.tasksResolved} / ${closeout.metrics.tasksTotal}`, 'resolved'],
                        ['Habit adherence', `${closeout.metrics.habitAdherencePercent}%`, `${closeout.metrics.habitsCompleted} complete · ${closeout.metrics.habitsSkipped} skipped`],
                        ['Diary', `${closeout.metrics.diaryDays} days`, 'completed'],
                        ['Constitution', `${closeout.metrics.constitutionSp} SP`, `${closeout.metrics.constitutionViolations} violations`],
                    ].map(([label, value, context]) => <Surface className="p-5" key={label}><p className="text-xs font-bold tracking-wider text-muted uppercase">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-sm text-secondary">{context}</p></Surface>)}
                    <Surface className="p-5"><CheckCircle2 className="text-[var(--season-accent)]" size={20} /><p className="mt-3 font-bold">Derived, not duplicated</p><p className="mt-1 text-sm leading-6 text-muted">This recap reads the final authoritative module records.</p></Surface>
                </div>
            </section>

            <form className="rounded-[2rem] border border-border-subtle bg-surface p-6" onSubmit={submit}>
                <label className="text-lg font-bold" htmlFor={`reflection-${closeout.seasonId}`}>Optional reflection</label>
                <p className="mt-1 text-sm text-muted">What worked, what changed, and what should the next Season carry forward?</p>
                <textarea className="focus-ring mt-4 min-h-32 w-full resize-y rounded-2xl border border-border-strong bg-app p-4 text-foreground" id={`reflection-${closeout.seasonId}`} maxLength={5000} onChange={(event) => form.setData('reflection', event.target.value)} value={form.data.reflection} />
                {form.errors.reflection && <p className="mt-2 text-sm text-danger">{form.errors.reflection}</p>}
                <Button className="mt-4" disabled={form.processing} type="submit">{intermission ? 'Save reflection' : 'Continue to the next Season'}</Button>
            </form>
        </div>
    );
}
