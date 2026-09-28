import { router } from '@inertiajs/react';
import { useState } from 'react';

import { Drawer } from '../../components/ui';
import { classNames } from '../../components/ui/classNames';
import type { TodaySettingsData } from './types';

export function TodaySettingsDrawer({ settings, onClose }: { settings: TodaySettingsData; onClose: () => void }) {
    const [showFlexibleHabits, setShowFlexibleHabits] = useState(settings.showFlexibleHabits);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    function toggleFlexibleHabits() {
        if (saving) return;

        const nextValue = !showFlexibleHabits;
        setShowFlexibleHabits(nextValue);
        setSaving(true);
        setSaveError(null);

        router.put('/today/settings', { show_flexible_habits: nextValue }, {
            preserveScroll: true,
            onError: () => {
                setShowFlexibleHabits(!nextValue);
                setSaveError('Could not save this setting. Try again.');
            },
            onFinish: () => setSaving(false),
        });
    }

    return (
        <Drawer description="Choose what appears on Today." onClose={onClose} open title="Today settings">
            <div className="rounded-2xl border border-border-subtle bg-inset p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-base font-bold" id="today-flexible-habits-label">Flexible habits</p>
                        <p className="mt-1 text-sm leading-5 text-secondary" id="today-flexible-habits-description">Show optional Habits in a collapsed group below required Habits.</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-center gap-1">
                        <button
                            aria-busy={saving || undefined}
                            aria-checked={showFlexibleHabits}
                            aria-describedby="today-flexible-habits-description"
                            aria-labelledby="today-flexible-habits-label"
                            className={classNames(
                                'focus-ring relative h-8 w-14 rounded-full border transition-[background-color,border-color] duration-200 disabled:cursor-wait',
                                showFlexibleHabits ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-border-strong bg-elevated',
                            )}
                            disabled={saving}
                            onClick={toggleFlexibleHabits}
                            role="switch"
                            type="button"
                        >
                            <span aria-hidden="true" className={classNames('absolute left-1 top-1 size-6 rounded-full bg-foreground shadow-sm transition-transform duration-200', showFlexibleHabits && 'translate-x-6 bg-accent-foreground')} />
                        </button>
                        <span aria-hidden="true" className="text-xs font-bold text-secondary">{showFlexibleHabits ? 'On' : 'Off'}</span>
                    </div>
                </div>
            </div>
            {(saving || saveError) && (
                <p aria-live="polite" className="mt-3 text-sm text-muted" role={saveError ? 'alert' : 'status'}>
                    {saveError ?? 'Saving…'}
                </p>
            )}
        </Drawer>
    );
}
