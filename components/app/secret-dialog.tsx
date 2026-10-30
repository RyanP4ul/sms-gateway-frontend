'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Shows a secret exactly once (API keys, webhook signing secrets) with a copy button. */
export function SecretDialog({ title, description, value, onClose }: { title: string; description: string; value: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open={value !== null} onOpenChange={(o) => { if (!o) { setCopied(false); onClose(); } }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <code className="min-w-0 flex-1 font-mono text-[13px] break-all">{value}</code>
          <Button
            variant="outline" size="icon-sm"
            onClick={async () => { await navigator.clipboard.writeText(value ?? ''); setCopied(true); }}
            aria-label="Copy"
          >
            {copied ? <Check className="text-st-delivered" /> : <Copy />}
          </Button>
        </div>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
