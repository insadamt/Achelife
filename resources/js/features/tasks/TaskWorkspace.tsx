import type { ReactNode } from 'react';

export function TaskWorkspace({ children }: { children: ReactNode }) {
    return <div className="min-w-0 overflow-x-clip">{children}</div>;
}
