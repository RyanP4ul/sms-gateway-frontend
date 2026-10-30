'use client';

import { useState } from 'react';
import { DeviceSelect } from '@/components/app/device-select';
import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { Pager } from '@/components/app/pager';
import { StatusBadge } from '@/components/app/status-badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useApi } from '@/lib/hooks';
import type { Paged, SmsRow } from '@/lib/types';
import { fmtDate } from '@/lib/utils';

const STATUSES = ['pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled'];

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [device_id, setDevice] = useState('');
  const [status, setStatus] = useState('');
  const [batch_id, setBatch] = useState('');
  const { data, isLoading } = useApi<Paged & { messages: SmsRow[] }>('sms/history', { page, limit: 25, device_id, status, batch_id: batch_id.trim() }, { refetchInterval: 10_000 });
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <>
      <PageHeader title="History" description="Every message that has passed through the gateway, newest first." />
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <div className="w-52"><DeviceSelect all value={device_id} onChange={reset(setDevice)} /></div>
          <div className="w-40">
            <NativeSelect value={status} onChange={(e) => reset(setStatus)(e.target.value)}>
              <option value="">Any status</option>
              {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </NativeSelect>
          </div>
          <Input className="w-56 font-mono text-[13px]" placeholder="Batch ID" value={batch_id} onChange={(e) => reset(setBatch)(e.target.value)} />
        </div>
        <DataTable
          loading={isLoading} rows={data?.messages} rowKey={(m) => m.id} empty="No messages match these filters."
          columns={[
            { header: '#', cell: (m) => <span className="num text-muted-foreground">{m.id}</span> },
            { header: 'To', cell: (m) => <span className="font-mono text-[13px]">{m.phone_number}</span> },
            { header: 'Device', cell: (m) => m.device_id },
            { header: 'Status', cell: (m) => <StatusBadge status={m.status} /> },
            { header: 'Priority', align: 'right', cell: (m) => <span className="num">{m.priority}</span> },
            { header: 'Batch', cell: (m) => <button className="font-mono text-xs text-primary hover:underline" onClick={() => reset(setBatch)(m.batch_id ?? '')}>{m.batch_id ?? '—'}</button> },
            { header: 'Created', cell: (m) => <span className="text-muted-foreground">{fmtDate(m.created_at)}</span> },
          ]}
        />
        {data && <Pager page={data.page} totalPages={data.total_pages} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
