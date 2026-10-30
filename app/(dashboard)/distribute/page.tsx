'use client';

import { useState } from 'react';
import { Loader2, Shuffle } from 'lucide-react';
import { useDevices } from '@/components/app/device-select';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useAction } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const STRATEGIES = [
  { value: 'roundrobin', label: 'Round-robin', hint: 'Numbers are dealt out evenly, one device after another.' },
  { value: 'weighted', label: 'Weighted', hint: "Proportional to each device's weight (set on the Devices page)." },
  { value: 'performance', label: 'Performance', hint: 'Proportional to each device’s performance score — healthier phones get more.' },
  { value: 'cost', label: 'Lowest cost', hint: 'Favours devices with a cheaper cost per SMS.' },
] as const;

export default function DistributePage() {
  const { data } = useDevices();
  const [strategy, setStrategy] = useState<(typeof STRATEGIES)[number]['value']>('roundrobin');
  const [selected, setSelected] = useState<string[]>([]);
  const [raw, setRaw] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('5');
  const [result, setResult] = useState<any>(null);

  const numbers = raw.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean).length;
  const active = data?.devices.filter((d) => d.is_active) ?? [];
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const run = useAction<any>((v) => (v.strategy === 'roundrobin' ? 'sms/distribute' : 'sms/distribute-weighted'), {
    invalidate: ['sms/history', 'stats'],
    success: (r) => `${r.inserted} messages queued across ${Object.keys(r.distribution).length} devices`,
    onDone: (r) => setResult(r),
  });

  const body = { device_ids: selected, phone_numbers: raw, message, priority: Number(priority) };

  return (
    <>
      <PageHeader title="Distribution" description="Spread a large send across several phones so no single SIM carries the whole load." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3"><CardContent className="grid gap-4">
          <Field label="Strategy" hint={STRATEGIES.find((s) => s.value === strategy)?.hint}>
            <NativeSelect value={strategy} onChange={(e) => setStrategy(e.target.value as typeof strategy)}>
              {STRATEGIES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </NativeSelect>
          </Field>
          <Field label={`Phone numbers (${numbers})`} hint="One per line, or comma / semicolon separated. Duplicates, invalid and blacklisted numbers are dropped."><Textarea rows={7} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono text-[13px]" /></Field>
          <Field label="Message"><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={918} /></Field>
          <Field label="Priority (1–10)" className="max-w-40"><Input type="number" min={1} max={10} value={priority} onChange={(e) => setPriority(e.target.value)} /></Field>
          <div>
            <Button disabled={run.isPending || selected.length === 0 || numbers === 0 || !message} onClick={() => run.mutate({ ...body, strategy } as any)}>
              {run.isPending ? <Loader2 className="animate-spin" /> : <Shuffle />} Distribute {numbers || ''} numbers
            </Button>
          </div>
        </CardContent></Card>

        <div className="grid content-start gap-4 lg:col-span-2">
          <Card><CardContent className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">Devices ({selected.length} selected)</span>
              <button className="text-xs text-primary hover:underline" onClick={() => setSelected(selected.length === active.length ? [] : active.map((d) => d.device_id))}>{selected.length === active.length ? 'Clear' : 'Select all active'}</button>
            </div>
            {active.length === 0 && <p className="py-4 text-center text-[13px] text-muted-foreground">No active devices.</p>}
            {active.map((d) => (
              <label key={d.device_id} className={cn('flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-[13px] transition-colors', selected.includes(d.device_id) && 'border-primary/50 bg-accent')}>
                <Checkbox checked={selected.includes(d.device_id)} onChange={() => toggle(d.device_id)} />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{d.device_name || d.device_id}</span><span className="block text-xs text-muted-foreground">weight {d.weight} · score {d.performance_score} · {d.cost_per_sms}/sms</span></span>
              </label>
            ))}
          </CardContent></Card>

          {result && (
            <Card><CardContent className="grid gap-2 text-[13px]">
              <div className="font-medium">Last run · batch <span className="font-mono text-xs">{result.batch_id}</span></div>
              {Object.entries(result.distribution as Record<string, number>).map(([id, n]) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-28 truncate font-mono text-xs">{id}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(n / Math.max(1, result.inserted)) * 100}%` }} /></div>
                  <span className="num w-10 text-right">{n}</span>
                </div>
              ))}
              {result.blacklisted > 0 && <div className="text-xs text-muted-foreground">{result.blacklisted} numbers skipped (blacklisted)</div>}
            </CardContent></Card>
          )}
        </div>
      </div>
    </>
  );
}
