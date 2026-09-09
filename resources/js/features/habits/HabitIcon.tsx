import { Activity, Apple, BedDouble, BookOpen, Brain, CheckCheck, Dumbbell, Droplets, Footprints, HeartPulse, MoonStar, PencilLine, Sprout } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const habitIcons = {
    check: { label: 'Check-off', icon: CheckCheck },
    activity: { label: 'Activity', icon: Activity },
    apple: { label: 'Nutrition', icon: Apple },
    bed: { label: 'Sleep', icon: BedDouble },
    book: { label: 'Reading', icon: BookOpen },
    brain: { label: 'Mindfulness', icon: Brain },
    dumbbell: { label: 'Workout', icon: Dumbbell },
    droplets: { label: 'Hydration', icon: Droplets },
    footprints: { label: 'Walking', icon: Footprints },
    heart: { label: 'Wellbeing', icon: HeartPulse },
    islam: { label: 'Islam', icon: MoonStar },
    pencil: { label: 'Writing', icon: PencilLine },
    sprout: { label: 'Growth', icon: Sprout },
} as const satisfies Record<string, { label: string; icon: LucideIcon }>;

export type HabitIconName = keyof typeof habitIcons;

export function HabitIcon({ name, size = 19 }: { name: HabitIconName; size?: number }) {
    const Icon = habitIcons[name].icon;

    return <Icon aria-hidden="true" size={size} />;
}
