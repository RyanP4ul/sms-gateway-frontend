'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Button that asks before doing something destructive. */
export function ConfirmButton({
  children, title, description, confirmLabel = 'Confirm', onConfirm, pending, variant = 'outline', size = 'sm', destructive = true,
}: {
  children: React.ReactNode; title: string; description?: string; confirmLabel?: string; onConfirm: () => void; pending?: boolean;
  variant?: React.ComponentProps<typeof Button>['variant']; size?: React.ComponentProps<typeof Button>['size']; destructive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} disabled={pending}>{children}</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={destructive ? 'destructive' : 'default'} onClick={() => { setOpen(false); onConfirm(); }}>{confirmLabel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
