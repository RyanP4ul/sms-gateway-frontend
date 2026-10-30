'use client';

import { useState } from 'react';
import { CheckCheck, Plus } from 'lucide-react';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAction, useApi } from '@/lib/hooks';
import { fmtDate } from '@/lib/utils';

const TYPES: Record<string, { label: string; unit: string }> = {
  spike: { label: 'Volume spike', unit: 'messages in window' },
  flood: { label: 'Flood', unit: 'messages in window' },
  night_activity: { label: 'Night activity (23:00–06:00)', unit: 'messages in window' },
  high_fail_rate: { label: 'High failure rate', unit: '% failed per device' },
  same_number: { label: 'Same number repeated', unit: 'messages to one number' },
};
const ACTIONS: Record<string, string> = { alert: 'Raise alert only', block_device: 'Deactivate offending device', block_number: 'Flag number', throttle: 'Throttle' };

type Rule = { id: number; rule_name: string; rule_type: string; threshold_value: number; time_window_minutes: number; action_type: string; is_active: boolean };
type Ev = { id: number; rule_name: string; rule_type: string; action_taken: string | null; device_id: string | null; details: unknown; is_resolved: boolean; created_at: string };

export default function AnomalyPage() {
  const rules = useApi<{ rules: Rule[] }>('anomaly/rules');
  const [onlyOpen, setOnlyOpen] = useState(true);
  const events = useApi<{ events: Ev[] }>('anomaly/events', { limit: 50, unresolved: onlyOpen ? '1' : '0' }, { refetchInterval: 15_000 });
  const [f, setF] = useState({ rule_name: '', rule_type: 'spike', threshold_value: '100', time_window_minutes: '5', action_type: 'alert' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const create = useAction('anomaly/rules', { invalidate: ['anomaly/rules'], onDone: () => setF({ ...f, rule_name: '' }) });
  const resolve = useAction<{ event_id: number }>('anomaly/events/resolve', { invalidate: ['anomaly/events'] });

  return (
    <>
      <PageHeader title="Anomaly detection" description="Rules are evaluated every minute. A rule records at most one event per 15 minutes." />
      <Tabs defaultValue="events">
        <TabsList><TabsTrigger value="events">Events</TabsTrigger><TabsTrigger value="rules">Rules</TabsTrigger></TabsList>

        <TabsContent value="events">
          <Card className="gap-0 overflow-hidden py-0">
            <div className="flex items-center justify-between border-b p-4">
              <label className="flex cursor-pointer items-center gap-2 text-[13px]"><input type="checkbox" className="accent-primary" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> Unresolved only</label>
            </div>
            <DataTable
              loading={events.isLoading} rows={events.data?.events} rowKey={(e) => e.id} empty={onlyOpen ? 'No open anomalies. 🎉' : 'No events.'}
              columns={[
                { header: 'Rule', cell: (e) => (<div><div className="font-medium">{e.rule_name}</div><div className="text-xs text-muted-foreground">{TYPES[e.rule_type]?.label}</div></div>) },
                { header: 'Details', cell: (e) => <code className="block max-w-xs truncate text-xs" title={JSON.stringify(e.details)}>{JSON.stringify(e.details)}</code> },
                { header: 'Action', cell: (e) => <Badge variant="secondary">{(e.action_taken ?? '—').replace('_', ' ')}</Badge> },
                { header: 'When', cell: (e) => <span className="text-muted-foreground">{fmtDate(e.created_at)}</span> },
                { header: '', align: 'right', cell: (e) => (e.is_resolved ? <Badge variant="success">resolved</Badge> : <Button variant="outline" size="sm" onClick={() => resolve.mutate({ event_id: e.id })}><CheckCheck /> Resolve</Button>) },
              ]}
            />
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="grid gap-4 lg:grid-cols-5">
          <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New rule</CardTitle></CardHeader><CardContent className="grid gap-4">
            <Field label="Name"><Input value={f.rule_name} onChange={set('rule_name')} maxLength={100} /></Field>
            <Field label="Detects"><NativeSelect value={f.rule_type} onChange={set('rule_type')}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</NativeSelect></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Threshold" hint={TYPES[f.rule_type]?.unit}><Input type="number" min={1} value={f.threshold_value} onChange={set('threshold_value')} /></Field>
              <Field label="Window (min)"><Input type="number" min={1} value={f.time_window_minutes} onChange={set('time_window_minutes')} /></Field>
            </div>
            <Field label="Action"><NativeSelect value={f.action_type} onChange={set('action_type')}>{Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</NativeSelect></Field>
            <div><Button disabled={create.isPending || !f.rule_name.trim()} onClick={() => create.mutate({ ...f, threshold_value: Number(f.threshold_value), time_window_minutes: Number(f.time_window_minutes) })}><Plus /> Add rule</Button></div>
          </CardContent></Card>
          <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
            <DataTable
              loading={rules.isLoading} rows={rules.data?.rules} rowKey={(r) => r.id} empty="No rules."
              columns={[
                { header: 'Rule', cell: (r) => <span className="font-medium">{r.rule_name}</span> },
                { header: 'Condition', cell: (r) => <span className="text-[13px]">{TYPES[r.rule_type]?.label}: ≥ <span className="num">{r.threshold_value}</span> / {r.time_window_minutes} min</span> },
                { header: 'Action', cell: (r) => <Badge variant="secondary">{r.action_type.replace('_', ' ')}</Badge> },
              ]}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
