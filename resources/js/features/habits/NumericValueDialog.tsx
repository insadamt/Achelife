import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import { Button, Dialog, Field } from '../../components/ui';
import { formatHabitDate, formatNumber } from './habitPresentation';
import type { HabitDayData, HabitViewData } from './types';

interface NumericValueDialogProps {
    habit: HabitViewData;
    day: HabitDayData;
    onClose: () => void;
}

export function NumericValueDialog({ habit, day, onClose }: NumericValueDialogProps) {
    const form = useForm({ value: day.numericValue ? formatNumber(day.numericValue) : '' });

    function save(event: FormEvent) {
        event.preventDefault();
        form.put(`/habits/${habit.id}/occurrences/${day.date}/numeric`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    function clearValue() {
        router.delete(`/habits/${habit.id}/occurrences/${day.date}`, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    return (
        <Dialog description={formatHabitDate(day.date)} onClose={onClose} open title={habit.name}>
            <div className="rounded-2xl border border-border-subtle bg-app p-4">
                <p className="text-[0.625rem] font-bold tracking-[0.14em] text-muted uppercase">Target</p>
                <p className="mt-1 text-lg font-bold">
                    {formatNumber(day.target)} {habit.unit}
                </p>
                {day.numericValue !== null && (
                    <p className="mt-2 text-xs text-secondary">Stored value: {formatNumber(day.numericValue)} {habit.unit}</p>
                )}
            </div>
            <form className="mt-5" onSubmit={save}>
                <Field
                    autoFocus
                    error={form.errors.value}
                    label="Value"
                    min="0"
                    onChange={(event) => form.setData('value', event.target.value)}
                    placeholder="0"
                    step="any"
                    type="number"
                    value={form.data.value}
                />
                <div className="mt-6 flex gap-2">
                    <Button className="flex-1" disabled={form.processing} type="submit">Save</Button>
                    <Button className="flex-1" onClick={clearValue} variant="secondary">Clear / reset</Button>
                </div>
            </form>
        </Dialog>
    );
}
