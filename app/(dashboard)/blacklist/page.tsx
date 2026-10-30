'use client';

import { useState } from 'react';
import { Ban, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/app/confirm-button';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAction, useApi } from '@/lib/hooks';
import { fmtDate } from '@/lib/utils';

type Entry = { id: number; phone_number: string; reason: string | null; created_at: string };

export default function BlacklistPage() {
  const { data, isLoading } = useApi<{ blacklist: Entry[] }>('blacklist');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const add = useAction('blacklist', { invalidate: ['blacklist', 'sms/history'], onDone: () => { setPhone(''); setReason(''); } });
  const remove = useAction<string>((p) => `blacklist/${encodeURIComponent(p)}`, { method: 'DELETE', invalidate: ['blacklist'] });

  return (
    <>
      <PageHeader title="Blacklist" description="Numbers that must never receive a message. Adding one also cancels anything already queued for it." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>Block a number</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Phone number"><Input className="font-mono" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+905551234567" /></Field>
          <Field label="Reason (optional)"><Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} /></Field>
          <div><Button variant="destructive" disabled={add.isPending || !phone.trim()} onClick={() => add.mutate({ phone_number: phone, reason: reason || undefined })}><Ban /> Add to blacklist</Button></div>
        </CardContent></Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <DataTable
            loading={isLoading} rows={data?.blacklist} rowKey={(b) => b.id} empty="The blacklist is empty."
            columns={[
              { header: 'Number', cell: (b) => <span className="font-mono text-[13px]">{b.phone_number}</span> },
              { header: 'Reason', cell: (b) => b.reason ?? <span className="text-muted-foreground">—</span> },
              { header: 'Added', cell: (b) => <span className="text-muted-foreground">{fmtDate(b.created_at)}</span> },
              { header: '', align: 'right', cell: (b) => <ConfirmButton variant="ghost" size="icon-sm" title="Remove from blacklist?" description={`${b.phone_number} will be able to receive messages again.`} confirmLabel="Remove" onConfirm={() => remove.mutate(b.phone_number)}><Trash2 className="text-destructive" /></ConfirmButton> },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
