'use client';

import { useState } from 'react';
import { Webhook } from 'lucide-react';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { SecretDialog } from '@/components/app/secret-dialog';
import { StatusBadge } from '@/components/app/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAction, useApi } from '@/lib/hooks';
import { fmtDate, fmtNum } from '@/lib/utils';

const EVENTS = ['sms.sent', 'sms.delivered', 'sms.failed', 'sms.incoming', 'device.offline', 'device.registered'];
type Hook = { id: number; url: string; events: string[]; is_active: boolean; last_triggered_at: string | null; failure_count: number };

export default function WebhooksPage() {
  const { data, isLoading } = useApi<{ webhooks: Hook[] }>('webhooks');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['sms.sent', 'sms.failed']);
  const [secret, setSecret] = useState<string | null>(null);
  const create = useAction<any, { secret: string }>('webhooks', { invalidate: ['webhooks'], success: 'Webhook created', onDone: (r) => { setSecret(r.secret); setUrl(''); } });

  return (
    <>
      <PageHeader title="Webhooks" description="Get an HTTPS POST when something happens. Each request carries an X-Webhook-Signature header: the HMAC-SHA256 of the body, keyed with the webhook’s secret." />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="h-fit lg:col-span-2"><CardHeader><CardTitle>New webhook</CardTitle></CardHeader><CardContent className="grid gap-4">
          <Field label="Endpoint URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hooks/sms" /></Field>
          <Field label="Events">
            <div className="grid gap-2">
              {EVENTS.map((ev) => (
                <label key={ev} className="flex cursor-pointer items-center gap-2.5 text-[13px]">
                  <Checkbox checked={events.includes(ev)} onChange={() => setEvents((c) => (c.includes(ev) ? c.filter((x) => x !== ev) : [...c, ev]))} />
                  <span className="font-mono">{ev}</span>
                </label>
              ))}
            </div>
          </Field>
          <div><Button disabled={create.isPending || !url.trim() || !events.length} onClick={() => create.mutate({ url, events })}><Webhook /> Create webhook</Button></div>
        </CardContent></Card>
        <Card className="gap-0 overflow-hidden py-0 lg:col-span-3">
          <DataTable
            loading={isLoading} rows={data?.webhooks} rowKey={(w) => w.id} empty="No webhooks configured."
            columns={[
              { header: 'Endpoint', cell: (w) => (<div className="max-w-xs"><div className="truncate font-mono text-[13px]" title={w.url}>{w.url}</div><div className="mt-1 flex flex-wrap gap-1">{w.events.map((e) => <Badge key={e} variant="secondary" className="font-mono">{e}</Badge>)}</div></div>) },
              { header: 'State', cell: (w) => <StatusBadge status={w.is_active ? 'active' : 'inactive'} /> },
              { header: 'Failures', align: 'right', cell: (w) => <span className="num">{fmtNum(w.failure_count)}</span> },
              { header: 'Last fired', cell: (w) => <span className="text-muted-foreground">{fmtDate(w.last_triggered_at)}</span> },
            ]}
          />
        </Card>
      </div>
      <SecretDialog title="Webhook signing secret" description="Use this to verify the X-Webhook-Signature header. It is shown only once." value={secret} onClose={() => setSecret(null)} />
    </>
  );
}
