'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/app/confirm-button';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAction, useApi } from '@/lib/hooks';
import { fmtDate, timeAgo } from '@/lib/utils';

const METRICS: Record<string, string> = { queue_size: 'Pending messages', fail_rate: 'Failure rate % (10 min)', throughput: 'Sent in last 5 min', response_time: 'Avg send time (s)' };
type Rule = { id: number; rule_name: string; metric: string; scale_up_threshold: number; scale_down_threshold: number; min_devices: number; max_devices: number; cooldown_minutes: number; is_active: boolean; last_action: string | null; last_action_at: string | null };
type Hist = { id: number; rule_name: string | null; action: string; device_id: string | null; metric_value: number; active_device_count: number; created_at: string };

export default function AutoscalePage() {
  const rules = useApi<{ rules: Rule[] }>('autoscale/rules');
  const history = useApi<{ history: Hist[] }>('autoscale/history', { limit: 50 });
  const [f, setF] = useState({ rule_name: '', metric: 'queue_size', scale_up_threshold: '100', scale_down_threshold: '10', min_devices: '1', max_devices: '10', cooldown_minutes: '5' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const create = useAction('autoscale/rules', { invalidate: ['autoscale/rules'], onDone: () => setF({ ...f, rule_name: '' }) });
  const toggle = useAction<{ id: number }>('autoscale/toggle', { invalidate: ['autoscale/rules'] });
  const remove = useAction<number>((id) => `autoscale/rules/${id}`, { method: 'DELETE', invalidate: ['autoscale/rules'] });

  return (
    <>
      <PageHeader title="Auto-scaling" description="Switch spare devices on when load rises and off when it falls. Evaluated every minute, respecting each rule’s cooldown." />
      <Tabs defaultValue="rules">
        <TabsList><TabsTrigger value="rules">Rules</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
        <TabsContent value="rules" className="grid gap-4 lg:grid-cols-5">
          <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New rule</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><Input value={f.rule_name} onChange={set('rule_name')} maxLength={100} /></Field>
            <Field label="Metric" className="sm:col-span-2"><NativeSelect value={f.metric} onChange={set('metric')}>{Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</NativeSelect></Field>
            <Field label="Scale up at ≥"><Input type="number" value={f.scale_up_threshold} onChange={set('scale_up_threshold')} /></Field>
            <Field label="Scale down at ≤"><Input type="number" value={f.scale_down_threshold} onChange={set('scale_down_threshold')} /></Field>
            <Field label="Min devices"><Input type="number" min={0} value={f.min_devices} onChange={set('min_devices')} /></Field>
            <Field label="Max devices"><Input type="number" min={1} value={f.max_devices} onChange={set('max_devices')} /></Field>
            <Field label="Cooldown (min)" className="sm:col-span-2"><Input type="number" min={1} value={f.cooldown_minutes} onChange={set('cooldown_minutes')} /></Field>
            <div className="sm:col-span-2"><Button disabled={create.isPending || !f.rule_name.trim()} onClick={() => create.mutate(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, k === 'rule_name' || k === 'metric' ? v : Number(v)])))}><Plus /> Add rule</Button></div>
          </CardContent></Card>
          <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
            <DataTable
              loading={rules.isLoading} rows={rules.data?.rules} rowKey={(r) => r.id} empty="No rules yet."
              columns={[
                { header: 'Rule', cell: (r) => (<div><div className="font-medium">{r.rule_name}</div><div className="text-xs text-muted-foreground">{METRICS[r.metric]} · up ≥{r.scale_up_threshold} · down ≤{r.scale_down_threshold} · {r.min_devices}–{r.max_devices} devices</div></div>) },
                { header: 'Last action', cell: (r) => (r.last_action ? <span className="text-[13px]">{r.last_action.replace('_', ' ')} <span className="text-muted-foreground">{timeAgo(r.last_action_at)}</span></span> : <span className="text-muted-foreground">—</span>) },
                { header: 'Active', cell: (r) => <Switch checked={r.is_active} onCheckedChange={() => toggle.mutate({ id: r.id })} aria-label="Toggle rule" /> },
                { header: '', align: 'right', cell: (r) => <ConfirmButton variant="ghost" size="icon-sm" title="Delete rule?" confirmLabel="Delete" onConfirm={() => remove.mutate(r.id)}><Trash2 className="text-destructive" /></ConfirmButton> },
              ]}
            />
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card className="gap-0 overflow-hidden py-0">
            <DataTable
              loading={history.isLoading} rows={history.data?.history} rowKey={(h) => h.id} empty="No scaling actions yet."
              columns={[
                { header: 'When', cell: (h) => <span className="text-muted-foreground">{fmtDate(h.created_at)}</span> },
                { header: 'Rule', cell: (h) => h.rule_name ?? '—' },
                { header: 'Action', cell: (h) => <Badge variant={h.action === 'scale_up' ? 'success' : 'warning'}>{h.action.replace('_', ' ')}</Badge> },
                { header: 'Device', cell: (h) => <span className="font-mono text-xs">{h.device_id ?? '—'}</span> },
                { header: 'Metric', align: 'right', cell: (h) => <span className="num">{h.metric_value}</span> },
                { header: 'Active after', align: 'right', cell: (h) => <span className="num">{h.active_device_count}</span> },
              ]}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
