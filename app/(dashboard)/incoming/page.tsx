'use client';

import { useState } from 'react';
import { CheckCheck, Reply } from 'lucide-react';
import { DeviceSelect } from '@/components/app/device-select';
import { PageHeader } from '@/components/app/page-header';
import { Pager } from '@/components/app/pager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAction, useApi } from '@/lib/hooks';
import type { Paged } from '@/lib/types';
import { cn, fmtDate } from '@/lib/utils';

type Msg = { id: number; device_id: string; sender_number: string; message: string; received_at: string; is_read: boolean; auto_reply_sent: boolean };

export default function IncomingPage() {
  const [page, setPage] = useState(1);
  const [device_id, setDevice] = useState('');
  const [is_read, setRead] = useState('');
  const { data, isLoading } = useApi<Paged & { messages: Msg[] }>('incoming', { page, limit: 20, device_id, is_read }, { refetchInterval: 10_000 });
  const markRead = useAction<{ ids: number[] }>('incoming/read', { invalidate: ['incoming'], success: 'Marked as read' });
  const unread = data?.messages.filter((m) => !m.is_read).map((m) => m.id) ?? [];

  return (
    <>
      <PageHeader
        title="Incoming SMS" description="Messages received by your phones. Matching auto-reply rules answer automatically."
        actions={<Button variant="outline" size="sm" disabled={!unread.length || markRead.isPending} onClick={() => markRead.mutate({ ids: unread })}><CheckCheck /> Mark page as read</Button>}
      />
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <div className="w-52"><DeviceSelect all value={device_id} onChange={(v) => { setDevice(v); setPage(1); }} /></div>
          <div className="w-40"><NativeSelect value={is_read} onChange={(e) => { setRead(e.target.value); setPage(1); }}><option value="">All</option><option value="0">Unread</option><option value="1">Read</option></NativeSelect></div>
        </div>
        <ul className="divide-y">
          {isLoading && !data && Array.from({ length: 4 }).map((_, i) => <li key={i} className="p-4"><Skeleton className="h-10 w-full" /></li>)}
          {data?.messages.length === 0 && <li className="py-12 text-center text-[13px] text-muted-foreground">No incoming messages.</li>}
          {data?.messages.map((m) => (
            <li key={m.id} className={cn('flex gap-3 p-4', !m.is_read && 'bg-accent/40')}>
              <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', m.is_read ? 'bg-transparent' : 'bg-primary')} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-mono text-[13px] font-medium">{m.sender_number}</span>
                  <span className="text-xs text-muted-foreground">to {m.device_id} · {fmtDate(m.received_at)}</span>
                  {m.auto_reply_sent && <Badge variant="success"><Reply /> auto-replied</Badge>}
                </div>
                <p className="mt-1 text-sm break-words whitespace-pre-wrap">{m.message}</p>
              </div>
              {!m.is_read && <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ ids: [m.id] })}>Mark read</Button>}
            </li>
          ))}
        </ul>
        {data && <Pager page={data.page} totalPages={data.total_pages} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
