'use client';

import { Bars } from '@/components/app/bars';
import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi } from '@/lib/hooks';
import { fmtNum } from '@/lib/utils';

type Queue = {
  status_counts: Record<string, number>;
  throughput: { minute: string; total: number; sent: number; failed: number; pending: number }[];
  device_queues: { device_id: string; device_name: string | null; pending: number; processing: number; sent: number; failed: number }[];
  avg_process_seconds: number;
  queue_trend: { hour: string; pending_at_hour: number; total_at_hour: number }[];
};

export default function QueuePage() {
  const { data, isLoading } = useApi<Queue>('stats/queue', undefined, { refetchInterval: 5000 });
  const c = data?.status_counts ?? {};

  return (
    <>
      <PageHeader title="Live queue" description="Throughput, per-device backlog and processing time. Refreshes every 5 seconds." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending" value={fmtNum(c.pending)} tone={(c.pending ?? 0) > 500 ? 'warn' : undefined} loading={isLoading} />
        <StatCard label="Processing" value={fmtNum(c.processing)} loading={isLoading} />
        <StatCard label="Failed (retrying)" value={fmtNum(c.failed)} tone={(c.failed ?? 0) > 0 ? 'bad' : undefined} loading={isLoading} />
        <StatCard label="Avg. send time (1 h)" value={`${data?.avg_process_seconds ?? 0}s`} hint="created → sent" loading={isLoading} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Throughput — last hour, per minute</CardTitle></CardHeader>
          <CardContent><Bars data={(data?.throughput ?? []).map((t) => ({ label: t.minute.slice(3), value: t.sent, secondary: t.failed }))} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Created — last 24 hours, per hour</CardTitle></CardHeader>
          <CardContent><Bars data={(data?.queue_trend ?? []).map((t) => ({ label: t.hour.slice(11, 13), value: t.total_at_hour }))} primaryLabel="created" /></CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="py-4"><CardTitle>Device queues (24 h)</CardTitle></CardHeader>
        <DataTable
          loading={isLoading} rows={data?.device_queues} rowKey={(d) => d.device_id} empty="No messages in the last 24 hours."
          columns={[
            { header: 'Device', cell: (d) => <span className="font-medium">{d.device_name || d.device_id}</span> },
            { header: 'Pending', align: 'right', cell: (d) => <span className="num text-st-pending">{fmtNum(d.pending)}</span> },
            { header: 'Processing', align: 'right', cell: (d) => <span className="num text-st-processing">{fmtNum(d.processing)}</span> },
            { header: 'Sent', align: 'right', cell: (d) => <span className="num text-st-sent">{fmtNum(d.sent)}</span> },
            { header: 'Failed', align: 'right', cell: (d) => <span className="num text-st-failed">{fmtNum(d.failed)}</span> },
          ]}
        />
      </Card>
    </>
  );
}
