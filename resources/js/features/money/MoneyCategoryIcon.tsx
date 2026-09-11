import {
    BookOpen,
    Briefcase,
    Car,
    CircleDollarSign,
    Gamepad2,
    Gift,
    Heart,
    Home,
    Landmark,
    Plane,
    Receipt,
    Shapes,
    ShoppingBag,
    Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

import { classNames } from '../../components/ui/classNames';

const categoryIcons: Array<{ terms: string[]; icon: LucideIcon }> = [
    { terms: ['food', 'restaurant', 'grocery'], icon: Utensils },
    { terms: ['transport', 'car', 'fuel'], icon: Car },
    { terms: ['housing', 'home', 'rent'], icon: Home },
    { terms: ['health', 'care', 'medical'], icon: Heart },
    { terms: ['shopping', 'clothing'], icon: ShoppingBag },
    { terms: ['gift', 'donation', 'charity'], icon: Gift },
    { terms: ['education', 'book'], icon: BookOpen },
    { terms: ['work', 'business', 'freelance'], icon: Briefcase },
    { terms: ['travel', 'vacation'], icon: Plane },
    { terms: ['entertainment', 'game'], icon: Gamepad2 },
    { terms: ['bill', 'utilities', 'subscription'], icon: Receipt },
    { terms: ['financial', 'investment', 'bank'], icon: Landmark },
    { terms: ['income', 'salary', 'coverage'], icon: CircleDollarSign },
];

function resolveCategoryIcon(name: string, presetKey?: string | null): LucideIcon {
    const searchableValue = `${presetKey ?? ''} ${name}`.toLowerCase();
    return categoryIcons.find(({ terms }) => terms.some((term) => searchableValue.includes(term)))?.icon ?? Shapes;
}

export function MoneyCategoryIcon({ className, name, presetKey, size = 18 }: { className?: string; name: string; presetKey?: string | null; size?: number }) {
    return (
        <span className={classNames('grid shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--money-accent)_11%,transparent)] text-accent-ink', className)}>
            {createElement(resolveCategoryIcon(name, presetKey), { 'aria-hidden': true, size })}
        </span>
    );
}
