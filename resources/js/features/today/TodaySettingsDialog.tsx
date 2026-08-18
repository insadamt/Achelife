import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Checkbox, Dialog } from '../../components/ui';
import type { TodaySettingsData } from './types';

export function TodaySettingsDialog({ settings, onClose }: { settings: TodaySettingsData; onClose: () => void }) {
    const form = useForm({
        show_flexible_habits: settings.showFlexibleHabits,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put('/today/settings', { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog description="Choose which optional items appear in your daily flow." onClose={onClose} open title="Today settings">
            <form onSubmit={submit}>
                <div className="space-y-5">
                    <Checkbox checked={form.data.show_flexible_habits} description="Keep optional, non-required Habits available in a collapsed section." label="Show flexible habits" onChange={(event) => form.setData('show_flexible_habits', event.target.checked)} />
                </div>
                <Button className="mt-7" disabled={form.processing} fullWidth type="submit">Save settings</Button>
            </form>
        </Dialog>
    );
}
