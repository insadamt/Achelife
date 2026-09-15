import type { PropsWithChildren } from 'react';

import { Dialog } from './Dialog';

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    desktopCard?: boolean;
    size?: 'default' | 'large';
}

export function Drawer({ open, onClose, title, description, desktopCard = false, size = 'default', children }: PropsWithChildren<DrawerProps>) {
    return (
        <Dialog description={description} onClose={onClose} open={open} placement={desktopCard ? 'right-card' : 'right'} size={size} title={title}>
            {children}
        </Dialog>
    );
}
