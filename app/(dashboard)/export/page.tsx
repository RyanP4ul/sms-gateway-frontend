'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { DeviceSelect } from '@/components/app/device-select';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { buildUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ExportPage() {
  const [days, setDays] = useState('30');
  const [device_id, setDevice] = useState('');
  const periods = [7, 30, 90, 180, 365].map((d) => <option key={d} value={d}>Last {d} days</option>);

  return (
    <>
      <PageHeader title="Export" description="Download CSV files (UTF-8 with BOM, so Excel shows Turkish characters correctly). Each export is capped at 10,000 rows." />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Messages</CardTitle><CardDescription>Every SMS in the period, optionally for one device.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Period"><NativeSelect value={days} onChange={(e) => setDays(e.target.value)}>{periods}</NativeSelect></Field>
            <Field label="Device"><DeviceSelect all value={device_id} onChange={setDevice} /></Field>
            <a className={cn(buttonVariants())} href={buildUrl('export/csv', { type: 'sms', days, device_id })}><Download /> Download messages.csv</a>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Devices</CardTitle><CardDescription>Fleet inventory with scores, totals and cost rates.</CardDescription></CardHeader>
          <CardContent><a className={cn(buttonVariants())} href={buildUrl('export/csv', { type: 'devices' })}><Download /> Download devices.csv</a></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Audit log</CardTitle><CardDescription>Security and activity trail.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Period"><NativeSelect value={days} onChange={(e) => setDays(e.target.value)}>{periods}</NativeSelect></Field>
            <a className={cn(buttonVariants())} href={buildUrl('export/csv', { type: 'audit', days })}><Download /> Download audit.csv</a>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
