import { Check, Trash2, X } from 'lucide-react';

import { Button, Dialog, DialogDismissButton } from '../../components/ui';

interface MoneyConfirmationDialogProps {
    confirmLabel: string;
    description: string;
    onClose: () => void;
    onConfirm: () => void;
    open: boolean;
    title: string;
    destructive?: boolean;
}

export function MoneyConfirmationDialog({
    confirmLabel,
    description,
    destructive = false,
    onClose,
    onConfirm,
    open,
    title,
}: MoneyConfirmationDialogProps) {
    return (
        <Dialog description={description} onClose={onClose} open={open} title={title}>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <DialogDismissButton variant="ghost">
                    <X aria-hidden="true" size={16} /> Cancel
                </DialogDismissButton>
                <Button onClick={onConfirm} variant={destructive ? 'destructive' : 'primary'}>
                    {destructive ? <Trash2 aria-hidden="true" size={16} /> : <Check aria-hidden="true" size={16} />}
                    {confirmLabel}
                </Button>
            </div>
        </Dialog>
    );
}
