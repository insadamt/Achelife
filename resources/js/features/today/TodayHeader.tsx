import { Settings } from 'lucide-react';

interface TodayHeaderProps {
    onOpenSettings: () => void;
}

export function TodayHeader({ onOpenSettings }: TodayHeaderProps) {
    return (
        <header className="page-chrome today-glass">
            <div className="min-w-0">
                <h1 className="text-[2rem] leading-[1.1] font-bold tracking-[-0.04em] sm:text-[2.5rem]">Today</h1>
            </div>
            <button
                aria-label="Open Today settings"
                className="today-glass-inner focus-ring grid size-10 shrink-0 place-items-center rounded-xl text-secondary transition-colors hover:text-foreground"
                onClick={onOpenSettings}
                type="button"
            >
                <Settings aria-hidden="true" size={18} />
            </button>
        </header>
    );
}
