import type { PropsWithChildren } from 'react';

import { Drawer } from '../../components/ui';

interface MoneyDrawerProps {
    onClose: () => void;
    open: boolean;
    title: string;
    description?: string;
}

export function MoneyDrawer({ children, description, onClose, open, title }: PropsWithChildren<MoneyDrawerProps>) {
    return (
        <Drawer desktopCard description={description} onClose={onClose} open={open} title={title}>
            {children}
        </Drawer>
    );
}
