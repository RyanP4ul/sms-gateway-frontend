'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { DeviceSelect } from '@/components/app/device-select';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAction, useApi } from '@/lib/hooks';

type Template = { id: number; name: string; content: string; variables: string[] | null; is_active: boolean };

function TemplatePicker({ onPick }: { onPick: (t: Template | null) => void }) {
  const { data } = useApi<{ templates: Template[] }>('templates');
  return (
    <NativeSelect defaultValue="" onChange={(e) => onPick(data?.templates.find((t) => t.id === Number(e.target.value)) ?? null)}>
      <option value="">No template</option>
      {data?.templates.filter((t) => t.is_active).map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
    </NativeSelect>
  );
}

function SingleTab() {
  const [f, setF] = useState({ device_id: '', phone_number: '', message: '', priority: '5', sim_slot: '0', scheduled_at: '', webhook_url: '' });
  const [tpl, setTpl] = useState<Template | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const send = useAction('sms/send', {
    invalidate: ['sms/history', 'stats'],
    success: (r: any) => `Queued as #${r.request_id}`,
    onDone: () => setF((p) => ({ ...p, phone_number: '', message: '' })),
  });

  return (
    <Card><CardContent className="grid gap-4 sm:grid-cols-2">
      <Field label="Device"><DeviceSelect value={f.device_id} onChange={(v) => setF({ ...f, device_id: v })} /></Field>
      <Field label="Phone number" hint="International format, e.g. +905551234567"><Input value={f.phone_number} onChange={set('phone_number')} placeholder="+905551234567" className="font-mono" /></Field>
      <Field label="Template" className="sm:col-span-2"><TemplatePicker onPick={(t) => { setTpl(t); setVars({}); }} /></Field>
      {tpl ? (
        <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
          <div className="rounded-md bg-muted/60 p-3 text-[13px] sm:col-span-2"><span className="text-muted-foreground">Preview: </span>{tpl.content.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] || `{{${k}}}`)}</div>
          {[...new Set([...(tpl.variables ?? []), ...[...tpl.content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!)])].map((k) => (
            <Field key={k} label={k}><Input value={vars[k] ?? ''} onChange={(e) => setVars({ ...vars, [k]: e.target.value })} /></Field>
          ))}
        </div>
      ) : (
        <Field label={`Message (${f.message.length}/918)`} className="sm:col-span-2"><Textarea rows={4} value={f.message} onChange={set('message')} maxLength={918} /></Field>
      )}
      <Field label="Priority (1–10)"><Input type="number" min={1} max={10} value={f.priority} onChange={set('priority')} /></Field>
      <Field label="SIM slot"><NativeSelect value={f.sim_slot} onChange={set('sim_slot')}><option value="0">Default</option><option value="1">SIM 1</option><option value="2">SIM 2</option></NativeSelect></Field>
      <Field label="Schedule (optional)"><Input type="datetime-local" value={f.scheduled_at} onChange={set('scheduled_at')} /></Field>
      <Field label="Delivery webhook URL (optional)"><Input value={f.webhook_url} onChange={set('webhook_url')} placeholder="https://…" /></Field>
      <div className="sm:col-span-2">
        <Button
          disabled={send.isPending || !f.device_id || !f.phone_number || (!tpl && !f.message)}
          onClick={() => send.mutate({
            device_id: f.device_id, phone_number: f.phone_number, priority: Number(f.priority), sim_slot: Number(f.sim_slot),
            ...(tpl ? { template_id: tpl.id, variables: vars } : { message: f.message }),
            ...(f.scheduled_at ? { scheduled_at: new Date(f.scheduled_at).toISOString() } : {}),
            ...(f.webhook_url ? { webhook_url: f.webhook_url } : {}),
          })}
        >
          {send.isPending ? <Loader2 className="animate-spin" /> : <Send />} Queue SMS
        </Button>
      </div>
    </CardContent></Card>
  );
}

function BulkTab() {
  const [device_id, setDevice] = useState('');
  const [raw, setRaw] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('5');
  const numbers = raw.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);

  const bulk = useAction('sms/bulk', {
    invalidate: ['sms/history', 'stats'],
    success: (r: any) => `${r.inserted} queued, ${r.skipped} skipped (batch ${r.batch_id})`,
    onDone: () => setRaw(''),
  });

  return (
    <Card><CardContent className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Device"><DeviceSelect value={device_id} onChange={setDevice} /></Field>
        <Field label="Priority (1–10)"><Input type="number" min={1} max={10} value={priority} onChange={(e) => setPriority(e.target.value)} /></Field>
      </div>
      <Field label={`Phone numbers (${numbers.length})`} hint="One per line, or comma / semicolon separated. Up to 500 per request. Invalid and blacklisted numbers are skipped."><Textarea rows={6} value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono text-[13px]" /></Field>
      <Field label="Message"><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={918} /></Field>
      <div>
        <Button
          disabled={bulk.isPending || !device_id || !numbers.length || !message}
          onClick={() => numbers.length > 500 ? toast.error('Maximum 500 numbers per request — use Distribution for larger lists') : bulk.mutate({ device_id, messages: numbers.map((phone_number) => ({ phone_number, message, priority: Number(priority) })) })}
        >
          {bulk.isPending ? <Loader2 className="animate-spin" /> : <Send />} Queue {numbers.length || ''} messages
        </Button>
      </div>
    </CardContent></Card>
  );
}

function CsvTab() {
  const [device_id, setDevice] = useState('');
  const [csv, setCsv] = useState('phone,name\n+905551234567,Ayşe\n');
  const [message, setMessage] = useState('Merhaba {{name}}!');
  const [priority, setPriority] = useState('5');

  const imp = useAction('sms/import-csv', {
    invalidate: ['sms/history', 'stats'],
    success: (r: any) => `${r.inserted} queued, ${r.skipped} skipped (batch ${r.batch_id})`,
  });

  return (
    <Card><CardContent className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Device"><DeviceSelect value={device_id} onChange={setDevice} /></Field>
        <Field label="Priority (1–10)"><Input type="number" min={1} max={10} value={priority} onChange={(e) => setPriority(e.target.value)} /></Field>
      </div>
      <Field label="CSV file or pasted text" hint="First row is the header. A phone / phone_number / telefon column is required; every other column is available as {{column}}.">
        <input type="file" accept=".csv,text/csv" className="text-[13px]" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} />
        <Textarea rows={6} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-[13px]" />
      </Field>
      <Field label="Message" hint="Use {{column}} placeholders."><Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={918} /></Field>
      <div><Button disabled={imp.isPending || !device_id || !csv || !message} onClick={() => imp.mutate({ device_id, csv_data: csv, message, priority: Number(priority) })}>{imp.isPending ? <Loader2 className="animate-spin" /> : <Send />} Import & queue</Button></div>
    </CardContent></Card>
  );
}

export default function SendPage() {
  return (
    <>
      <PageHeader title="Send SMS" description="Queue messages for a device to deliver. Phones pick them up on their next poll." />
      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single</TabsTrigger>
          <TabsTrigger value="bulk">Bulk</TabsTrigger>
          <TabsTrigger value="csv">CSV import</TabsTrigger>
        </TabsList>
        <TabsContent value="single"><SingleTab /></TabsContent>
        <TabsContent value="bulk"><BulkTab /></TabsContent>
        <TabsContent value="csv"><CsvTab /></TabsContent>
      </Tabs>
    </>
  );
}
