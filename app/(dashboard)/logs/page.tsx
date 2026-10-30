'use client';

import { useState } from 'react';
import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { Pager } from '@/components/app/pager';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useApi } from '@/lib/hooks';
import type { Paged } from '@/lib/types';
import { fmtDate } from '@/lib/utils';

type Log = { id: number; action: string; actor_type: string; actor_id: string | null; ip_address: string | null; request_method: string | null; request_path: string | null; details: unknown; created_at: string };

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [actor_type, setActor] = useState('');
  const { data, isLoading } = useApi<Paged & { logs: Log[] }>('audit-logs', { page, limit: 30, action: action.trim(), actor_type });

  return (
    <>
      <PageHeader title="Audit log" description="Who did what, from where. Failed sign-ins and rate-limit hits are recorded too. Entries are kept for 180 days." />
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap gap-3 border-b p-4">
          <Input className="w-56" placeholder="Filter action (e.g. sms.)" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} />
          <div className="w-40"><NativeSelect value={actor_type} onChange={(e) => { setActor(e.target.value); setPage(1); }}><option value="">Any actor</option>{['admin', 'device', 'system', 'anonymous'].map((a) => <option key={a} value={a}>{a}</option>)}</NativeSelect></div>
        </div>
        <DataTable
          loading={isLoading} rows={data?.logs} rowKey={(l) => l.id} empty="No log entries."
          columns={[
            { header: 'When', cell: (l) => <span className="text-muted-foreground">{fmtDate(l.created_at)}</span> },
            { header: 'Action', cell: (l) => <span className="font-mono text-[13px]">{l.action}</span> },
            { header: 'Actor', cell: (l) => (<div><Badge variant={l.actor_type === 'admin' ? 'info' : l.actor_type === 'anonymous' ? 'warning' : 'secondary'}>{l.actor_type}</Badge>{l.actor_id && <span className="ml-1.5 font-mono text-xs">{l.actor_id}</span>}</div>) },
            { header: 'IP', cell: (l) => <span className="font-mono text-xs">{l.ip_address ?? '—'}</span> },
            { header: 'Details', cell: (l) => (l.details ? <code className="block max-w-xs truncate text-xs" title={JSON.stringify(l.details)}>{JSON.stringify(l.details)}</code> : <span className="text-muted-foreground">—</span>) },
          ]}
        />
        {data && <Pager page={data.page} totalPages={data.total_pages} total={data.total} onPage={setPage} />}
      </Card>
    </>
  );
}
