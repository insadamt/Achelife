import { Head } from '@inertiajs/react';
import { useState } from 'react';

import {
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    Field,
    Metric,
    ProgressBar,
    SelectField,
    StatusChip,
    Surface,
} from '../components/ui';

export default function Home() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(64);

    return (
        <>
            <Head title="UI Foundation" />
            <header className="mb-8 flex flex-col justify-between gap-5 pb-3 sm:flex-row sm:items-end">
                <div>
                    <p className="text-xs font-bold tracking-[0.18em] text-accent uppercase">Phase 0.5</p>
                    <h1 className="mt-2 text-4xl font-bold tracking-[-0.045em] sm:text-6xl">Interface playground</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
                        A temporary, neutral preview of the primitives future Achelife modules will inherit.
                    </p>
                </div>
                <StatusChip status="active">Foundation preview</StatusChip>
            </header>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
                <Surface accent="var(--preview-blue)" className="p-5 sm:p-7" tinted>
                    <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
                        <Metric context="Large values establish hierarchy" label="Preview value" suffix="PTS" value="1,240" />
                        <CircularProgress label="Foundation progress preview" value={previewProgress} />
                    </div>
                    <ProgressBar activeGlow className="mt-8" label="Interactive progress preview" value={previewProgress} />
                    <label className="mt-5 block text-sm font-semibold text-secondary" htmlFor="progress-preview">
                        Adjust preview
                    </label>
                    <input
                        aria-valuetext={`${previewProgress}%`}
                        className="mt-2 w-full accent-[var(--module-accent)]"
                        id="progress-preview"
                        max="100"
                        min="0"
                        onChange={(event) => setPreviewProgress(Number(event.target.value))}
                        type="range"
                        value={previewProgress}
                    />
                </Surface>

                <Surface accent="var(--preview-violet)" className="p-5 sm:p-7" elevated tinted>
                    <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">State language</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em]">Clear at a glance</h2>
                    <div className="mt-6 flex flex-wrap gap-2">
                        <StatusChip status="active">Active</StatusChip>
                        <StatusChip status="completed">Completed</StatusChip>
                        <StatusChip status="locked">Locked</StatusChip>
                        <StatusChip status="warning">Warning</StatusChip>
                        <StatusChip status="danger">Danger</StatusChip>
                        <StatusChip>Neutral</StatusChip>
                    </div>
                    <div className="mt-7 border-t border-border-subtle pt-6">
                        <Metric context="Secondary context" label="Medium metric" suffix="UNITS" value="18" />
                    </div>
                </Surface>
            </div>

            <section className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <Surface accent="var(--preview-orange)" className="p-5 sm:p-7" tinted>
                    <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Controls</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em]">Decisive actions</h2>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button>Complete</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Delete</Button>
                        <Button disabled>Disabled</Button>
                    </div>
                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <Surface className="p-4">
                            <p className="text-sm font-semibold text-foreground">Default surface</p>
                            <p className="mt-1 text-sm text-muted">Meaningful grouping without emphasis.</p>
                        </Surface>
                        <Surface active className="p-4" interactive>
                            <p className="text-sm font-semibold text-foreground">Selected surface</p>
                            <p className="mt-1 text-sm text-muted">Accent responds to active state.</p>
                        </Surface>
                    </div>
                </Surface>

                <Surface accent="var(--preview-pink)" className="p-5 sm:p-7">
                    <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Form system</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em]">Accessible inputs</h2>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Field label="Text" placeholder="Type a value" />
                        <Field label="Number" min="0" placeholder="0" type="number" />
                        <Field label="Date" type="date" />
                        <SelectField
                            defaultValue="neutral"
                            label="Select"
                            options={[
                                { label: 'Neutral option', value: 'neutral' },
                                { label: 'Alternate option', value: 'alternate' },
                            ]}
                        />
                    </div>
                    <div className="mt-5">
                        <Checkbox description="A clear supporting description." label="Checkbox control" />
                    </div>
                </Surface>
            </section>

            <Surface accent="var(--preview-green)" className="mt-4 flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7" tinted>
                <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-muted uppercase">Overlay pattern</p>
                    <h2 className="mt-2 text-xl font-bold">Keyboard-ready dialog</h2>
                    <p className="mt-1 text-sm text-secondary">Focus is contained, Escape closes, and focus returns to the trigger.</p>
                </div>
                <Button onClick={() => setDialogOpen(true)} variant="secondary">
                    Open dialog
                </Button>
            </Surface>

            <Dialog description="This reusable overlay demonstrates focus management without adding feature behavior." onClose={() => setDialogOpen(false)} open={dialogOpen} title="Dialog preview">
                <div className="flex justify-end gap-3">
                    <Button onClick={() => setDialogOpen(false)} variant="ghost">
                        Cancel
                    </Button>
                    <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
                </div>
            </Dialog>
        </>
    );
}
