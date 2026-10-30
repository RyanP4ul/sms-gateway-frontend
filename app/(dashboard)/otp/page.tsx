'use client';

import { useState } from 'react';
import { CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import { DeviceSelect } from '@/components/app/device-select';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAction } from '@/lib/hooks';
import { fmtDate } from '@/lib/utils';

export default function OtpPage() {
  const [s, setS] = useState({ phone_number: '', device_id: '', purpose: 'verification', length: '6', ttl_seconds: '300', message_template: '' });
  const [v, setV] = useState({ phone_number: '', code: '', purpose: 'verification' });
  const [sent, setSent] = useState<{ expires_at: string } | null>(null);
  const [verified, setVerified] = useState(false);

  const send = useAction<any, { expires_at: string }>('otp/send', { onDone: (r) => { setSent(r); setV((p) => ({ ...p, phone_number: s.phone_number, purpose: s.purpose })); setVerified(false); } });
  const verify = useAction('otp/verify', { onDone: () => setVerified(true), success: 'Code verified' });

  return (
    <>
      <PageHeader title="One-time passwords" description="Send a code through a device and verify it. Codes are 4–8 digits, limited to 3 attempts, and 5 sends per number per hour." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Send a code</CardTitle><CardDescription>Use {'{{code}}'} in a custom message to place the code.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone number"><Input className="font-mono" value={s.phone_number} onChange={(e) => setS({ ...s, phone_number: e.target.value })} placeholder="+905551234567" /></Field>
            <Field label="Device"><DeviceSelect value={s.device_id} onChange={(x) => setS({ ...s, device_id: x })} /></Field>
            <Field label="Purpose"><Input value={s.purpose} maxLength={50} onChange={(e) => setS({ ...s, purpose: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Digits"><Input type="number" min={4} max={8} value={s.length} onChange={(e) => setS({ ...s, length: e.target.value })} /></Field>
              <Field label="TTL (s)"><Input type="number" min={60} max={3600} value={s.ttl_seconds} onChange={(e) => setS({ ...s, ttl_seconds: e.target.value })} /></Field>
            </div>
            <Field label="Message (optional)" className="sm:col-span-2"><Input value={s.message_template} onChange={(e) => setS({ ...s, message_template: e.target.value })} placeholder="Your login code is {{code}}" /></Field>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button disabled={send.isPending || !s.phone_number || !s.device_id} onClick={() => send.mutate({ ...s, length: Number(s.length), ttl_seconds: Number(s.ttl_seconds), message_template: s.message_template || undefined })}><KeyRound /> Send code</Button>
              {sent && <span className="text-xs text-muted-foreground">Queued · expires {fmtDate(sent.expires_at)}</span>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Verify a code</CardTitle><CardDescription>Checks the most recent unused code for the number and purpose.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Phone number"><Input className="font-mono" value={v.phone_number} onChange={(e) => setV({ ...v, phone_number: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code"><Input className="font-mono tracking-widest" inputMode="numeric" value={v.code} onChange={(e) => { setV({ ...v, code: e.target.value }); setVerified(false); }} /></Field>
              <Field label="Purpose"><Input value={v.purpose} onChange={(e) => setV({ ...v, purpose: e.target.value })} /></Field>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" disabled={verify.isPending || !v.phone_number || !v.code} onClick={() => verify.mutate(v)}><ShieldCheck /> Verify</Button>
              {verified && <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-st-delivered"><CheckCircle2 className="size-4" /> Verified</span>}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
