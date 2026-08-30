import { Head, useForm } from '@inertiajs/react';
import { ArchiveRestore, ArrowRight, CalendarDays, Check, CircleDollarSign, Flag, ListChecks, Repeat2, Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, Checkbox, Field, SelectField, Surface } from '../../components/ui';
import { RestorePreviewCard } from '../../features/portability/RestorePreviewCard';
import type { RestorePreview } from '../../features/portability/types';

type OnboardingStep = 'path' | 'profile' | 'objectives' | 'habit' | 'task' | 'money';

interface OnboardingProps {
    step: OnboardingStep;
    restorePreview: RestorePreview | null;
    profile: {
        name: string;
        timezone: string;
        today: string;
        seasonRolloverPreference: 'automatic' | 'manual';
    };
    timezones: Array<{ value: string; label: string }>;
}

function StepHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
    return (
        <header>
            <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">{description}</p>
        </header>
    );
}

function PathStep({ restorePreview }: { restorePreview: RestorePreview | null }) {
    const form = useForm({ path: 'fresh' });
    const upload = useForm<{ archive: File | null }>({ archive: null });
    const restore = useForm({ archive: '' });

    function previewRestore(event: FormEvent) {
        event.preventDefault();
        upload.post('/onboarding/restore/preview', { forceFormData: true });
    }

    return (
        <>
            <StepHeader eyebrow="Welcome to Achelife" title="How should we begin?" description="Choose before Achelife creates any Seasons, goals, routines, or financial records." />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
                <button className="focus-ring rounded-[2rem] border border-accent/45 bg-accent/8 p-6 text-left hover:bg-accent/12" disabled={form.processing} onClick={() => form.post('/onboarding/path')} type="button">
                    <Sparkles aria-hidden="true" className="text-accent" />
                    <span className="mt-5 block text-xl font-bold">Start fresh</span>
                    <span className="mt-2 block text-sm leading-6 text-secondary">Confirm your calendar, begin Season 1, and optionally set up each module.</span>
                    <span className="mt-6 flex items-center gap-2 text-sm font-bold text-accent">Begin setup <ArrowRight size={16} /></span>
                </button>
                <div className="rounded-[2rem] border border-border-subtle bg-surface p-6">
                    <ArchiveRestore aria-hidden="true" className="text-muted" />
                    <span className="mt-5 block text-xl font-bold">Restore backup</span>
                    <span className="mt-2 block text-sm leading-6 text-secondary">Validate an account snapshot before Achelife creates any fresh Seasons or module data.</span>
                    <form className="mt-5" onSubmit={previewRestore}>
                        <label className="text-sm font-semibold text-secondary" htmlFor="fresh-restore-archive">Achelife archive</label>
                        <input accept=".zip,.achelife.zip,application/zip" className="focus-ring mt-2 block w-full rounded-2xl border border-border-strong bg-app p-3 text-sm" id="fresh-restore-archive" onChange={(event) => upload.setData('archive', event.target.files?.[0] ?? null)} type="file" />
                        {upload.errors.archive && <p className="mt-2 text-sm font-medium text-danger" role="alert">{upload.errors.archive}</p>}
                        <Button className="mt-4" disabled={upload.processing || upload.data.archive === null} size="small" type="submit" variant="secondary">Validate and preview</Button>
                    </form>
                </div>
            </div>
            {restorePreview && (
                <div className="mt-6">
                    <RestorePreviewCard preview={restorePreview} />
                    {restore.errors.archive && <p className="mt-3 text-sm font-medium text-danger" role="alert">{restore.errors.archive}</p>}
                    <Button className="mt-5" disabled={restore.processing} onClick={() => restore.post('/onboarding/restore')}><ArchiveRestore size={17} /> Restore and continue</Button>
                </div>
            )}
        </>
    );
}

function ProfileStep({ profile, timezones }: Pick<OnboardingProps, 'profile' | 'timezones'>) {
    const form = useForm({ name: profile.name, timezone: profile.timezone, season_rollover_preference: profile.seasonRolloverPreference });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/onboarding/profile');
    }

    return (
        <>
            <StepHeader eyebrow="Step 1 of 5" title="Set your 30-day rhythm" description="Confirm your identity and local calendar before Season 1 is created. These dates remain stable even if your timezone changes later." />
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                    ['30 days', 'Every Season has a fixed Day 1 through Day 30.'],
                    ['Season Points', 'Tasks, Habits, Diary, Objectives, and Constitution shape SP.'],
                    ['Rank', 'SP moves you from Unranked and Bronze toward Legend.'],
                ].map(([title, copy]) => <Surface className="p-4" key={title}><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-5 text-muted">{copy}</p></Surface>)}
            </div>
            <form className="mt-6 space-y-5 rounded-[2rem] border border-border-subtle bg-surface p-6" onSubmit={submit}>
                <Field error={form.errors.name} label="Name" onChange={(event) => form.setData('name', event.target.value)} value={form.data.name} />
                <SelectField error={form.errors.timezone} label="Timezone" onChange={(event) => form.setData('timezone', event.target.value)} options={timezones} value={form.data.timezone} />
                <SelectField
                    error={form.errors.season_rollover_preference}
                    label="After Day 30"
                    onChange={(event) => form.setData('season_rollover_preference', event.target.value as 'automatic' | 'manual')}
                    options={[{ value: 'automatic', label: 'Automatic — next Season begins tomorrow' }, { value: 'manual', label: 'Manual — enter an intermission' }]}
                    value={form.data.season_rollover_preference}
                />
                <p className="text-sm text-muted">Season 1 will begin on your local date: {profile.today}.</p>
                <Button disabled={form.processing} type="submit">Confirm and create Season 1</Button>
            </form>
        </>
    );
}

function ObjectivesStep() {
    const form = useForm({ titles: ['', '', ''] });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ titles: data.titles.map((title) => title.trim()).filter(Boolean) }));
        form.post('/onboarding/objectives');
    };
    const skip = () => {
        form.transform(() => ({ titles: [] }));
        form.post('/onboarding/objectives');
    };

    return (
        <form onSubmit={submit}>
            <StepHeader eyebrow="Step 2 of 5 · Optional" title="Name up to three Objectives" description="Objectives are the outcomes that matter most this Season. You can skip this and add them through Day 7." />
            <div className="mt-7 space-y-4 rounded-[2rem] border border-border-subtle bg-surface p-6">
                {form.data.titles.map((title, index) => <Field error={form.errors[`titles.${index}`]} key={index} label={`Objective ${index + 1}`} onChange={(event) => form.setData('titles', form.data.titles.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} placeholder={index === 0 ? 'What would make this Season meaningful?' : 'Optional'} value={title} />)}
                <div className="flex flex-wrap gap-3"><Button disabled={form.processing} type="submit">Continue</Button><Button disabled={form.processing} onClick={skip} variant="ghost">Skip</Button></div>
            </div>
        </form>
    );
}

function OptionalNameStep({ kind }: { kind: 'habit' | 'task' }) {
    const form = useForm({ skip: false, name: '', title: '' });
    const label = kind === 'habit' ? 'Habit name' : 'Task title';
    const value = kind === 'habit' ? form.data.name : form.data.title;
    const icon = kind === 'habit' ? <Repeat2 /> : <ListChecks />;

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(`/onboarding/${kind}`);
    }

    function skip() {
        form.setData('skip', true);
        form.transform((data) => ({ ...data, skip: true }));
        form.post(`/onboarding/${kind}`);
    }

    return (
        <form onSubmit={submit}>
            <StepHeader eyebrow={`${kind === 'habit' ? 'Step 3' : 'Step 4'} of 5 · Optional`} title={kind === 'habit' ? 'Start one daily Habit' : 'Add a Task for today'} description={kind === 'habit' ? 'Begin with a simple daily Boolean Habit. You can customize schedules, difficulty, and numeric tracking later.' : 'Capture one concrete next action. Full scheduling, importance, recurrence, and subtasks remain available in Tasks.'} />
            <div className="mt-7 rounded-[2rem] border border-border-subtle bg-surface p-6">
                <span className="mb-5 grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">{icon}</span>
                <Field error={kind === 'habit' ? form.errors.name : form.errors.title} label={label} onChange={(event) => kind === 'habit' ? form.setData('name', event.target.value) : form.setData('title', event.target.value)} placeholder={kind === 'habit' ? 'Drink water' : 'Plan tomorrow'} value={value} />
                <div className="mt-6 flex flex-wrap gap-3"><Button disabled={form.processing} type="submit">Create and continue</Button><Button disabled={form.processing} onClick={skip} variant="ghost">Skip</Button></div>
            </div>
        </form>
    );
}

function MoneyStep() {
    const form = useForm({ install_preset_pack: true, create_account: true, account_name: 'Main account', currency: 'USD', initial_balance: '0.00' });
    const submit = (event: FormEvent) => { event.preventDefault(); form.post('/onboarding/money'); };

    return (
        <form onSubmit={submit}>
            <StepHeader eyebrow="Step 5 of 5 · Optional" title="Make Money useful now" description="Install Achelife’s editable category pack and optionally create your first Account. Money never affects SP, Rank, or Daily Progress." />
            <div className="mt-7 space-y-5 rounded-[2rem] border border-border-subtle bg-surface p-6">
                <Checkbox checked={form.data.install_preset_pack} description="Adds the complete Expense and Income taxonomy. Re-running the installer safely repairs missing presets." label="Install Money category pack" onChange={(event) => form.setData('install_preset_pack', event.target.checked)} />
                <Checkbox checked={form.data.create_account} description="Balances are global and continue through Season intermissions." label="Create my first Account" onChange={(event) => form.setData('create_account', event.target.checked)} />
                {form.data.create_account && <div className="grid gap-4 sm:grid-cols-3"><Field error={form.errors.account_name} label="Account name" onChange={(event) => form.setData('account_name', event.target.value)} value={form.data.account_name} /><Field error={form.errors.currency} label="Currency" maxLength={3} onChange={(event) => form.setData('currency', event.target.value.toUpperCase())} value={form.data.currency} /><Field error={form.errors.initial_balance} label="Initial balance" onChange={(event) => form.setData('initial_balance', event.target.value)} value={form.data.initial_balance} /></div>}
                <Button disabled={form.processing} type="submit"><Check size={17} /> Finish setup</Button>
            </div>
        </form>
    );
}

export default function Onboarding({ step, profile, timezones, restorePreview }: OnboardingProps) {
    return (
        <main className="min-h-screen bg-app px-4 py-10 text-foreground sm:px-6">
            <Head title="First-run setup" />
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center gap-3 text-sm font-bold text-muted"><Flag size={17} /> First-run setup <span aria-hidden="true">·</span> <CalendarDays size={17} /> Resumes safely at this step</div>
                {step === 'path' && <PathStep restorePreview={restorePreview} />}
                {step === 'profile' && <ProfileStep profile={profile} timezones={timezones} />}
                {step === 'objectives' && <ObjectivesStep />}
                {step === 'habit' && <OptionalNameStep kind="habit" />}
                {step === 'task' && <OptionalNameStep kind="task" />}
                {step === 'money' && <MoneyStep />}
                <p className="mt-8 flex items-center gap-2 text-sm text-muted"><CircleDollarSign size={16} /> Subscription synchronization begins normally after setup and remains active during intermissions.</p>
            </div>
        </main>
    );
}
