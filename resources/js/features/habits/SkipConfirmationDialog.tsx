import { router } from '@inertiajs/react';

import { Button, Dialog } from '../../components/ui';
import { formatHabitDate } from './habitPresentation';
import type { HabitDayData, HabitViewData } from './types';

interface SkipConfirmationDialogProps {
    habit: HabitViewData;
    day: HabitDayData;
    onClose: () => void;
}

export function SkipConfirmationDialog({ habit, day, onClose }: SkipConfirmationDialogProps) {
    function skip() {
        router.post(`/habits/${habit.id}/occurrences/${day.date}/skip`, {}, { preserveScroll: true, onSuccess: onClose });
    }

    return (
        <Dialog
            description={`${formatHabitDate(day.date)}. Skipping gives 0 SP and preserves the streak without increasing it.`}
            onClose={onClose}
            open
            title={`Skip ${habit.name}?`}
        >
            <div className="flex gap-2">
                <Button className="flex-1" onClick={onClose} variant="secondary">Cancel</Button>
                <Button className="flex-1" onClick={skip}>Confirm skip</Button>
            </div>
        </Dialog>
    );
}
