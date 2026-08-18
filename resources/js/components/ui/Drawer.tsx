import type { PropsWithChildren } from 'react';

import { Dialog } from './Dialog';

interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
}

export function Drawer({ open, onClose, title, description, children }: PropsWithChildren<DrawerProps>) {
    return (
        <Dialog description={description} onClose={onClose} open={open} placement="right" title={title}>
            {children}
        </Dialog>
    );
}
