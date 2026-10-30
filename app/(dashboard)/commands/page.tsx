'use client';

import { useState } from 'react';
import { Terminal } from 'lucide-react';
import { toast } from 'sonner';
import { DeviceSelect } from '@/components/app/device-select';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useAction, useApi } from '@/lib/hooks';
import { fmtDate } from '@/lib/utils';

const TYPES = ['restart_service', 'sync_config', 'update_app', 'clear_queue', 'send_log', 'custom'];
type Cmd = { id: number; device_id: string; device_name: string | null; command_type: string; status: string; created_at: string; executed_at: string | null; result: unknown };

export default function CommandsPage() {
  const [device_id, setDevice] = useState('');
  const [command_type, setType] = useState('sync_config');
  const [payload, setPayload] = useState('');
  const [expires, setExpires] = useState('30');
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useApi<{ commands: Cmd[] }>('commands', { device_id: filter, limit: 50 }, { refetchInterval: 10_000 });
  const create = useAction('commands', { invalidate: ['commands'], onDone: () => setPayload('') });

  function submit() {
    let parsed: unknown;
    if (payload.trim()) { try { parsed = JSON.parse(payload); } catch { return toast.error('Payload must be valid JSON'); } }
    create.mutate({ device_id, command_type, payload: parsed, expires_minutes: Number(expires) });
  }

  return (
    <>
      <PageHeader title="Remote commands" description="Queue an instruction for a phone. It collects commands whenever it polls, and unclaimed ones expire." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New command</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Device"><DeviceSelect value={device_id} onChange={setDevice} /></Field>
          <Field label="Command"><NativeSelect value={command_type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</NativeSelect></Field>
          <Field label="Payload (JSON, optional)"><Textarea rows={3} className="font-mono text-[13px]" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder='{"key": "value"}' /></Field>
          <Field label="Expires after (minutes)"><Input type="number" min={1} value={expires} onChange={(e) => setExpires(e.target.value)} /></Field>
          <div><Button disabled={create.isPending || !device_id} onClick={submit}><Terminal /> Send command</Button></div>
        </CardContent></Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <div className="w-60 border-b p-4"><DeviceSelect all value={filter} onChange={setFilter} /></div>
          <DataTable
            loading={isLoading} rows={data?.commands} rowKey={(c) => c.id} empty="No commands yet."
            columns={[
              { header: 'Command', cell: (c) => (<div><div className="font-medium">{c.command_type.replaceAll('_', ' ')}</div><div className="text-xs text-muted-foreground">{c.device_name || c.device_id}</div></div>) },
              { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
              { header: 'Created', cell: (c) => <span className="text-muted-foreground">{fmtDate(c.created_at)}</span> },
              { header: 'Result', cell: (c) => (c.result ? <code className="block max-w-40 truncate text-xs" title={JSON.stringify(c.result)}>{JSON.stringify(c.result)}</code> : <span className="text-muted-foreground">—</span>) },
            ]}
          />
        </Card>
      </div>
    </>
  );
}
