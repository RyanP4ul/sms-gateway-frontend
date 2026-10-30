'use client';

import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi } from '@/lib/hooks';

type Res = {
  checks: { check_type: string; target_id: string | null; is_up: boolean; created_at: string }[];
  device_uptime: { target_id: string; total_checks: number; up_count: number; uptime_pct: number; avg_response_ms: number | null }[];
  api_uptime: { uptime_pct: number; avg_response_ms: number };
};

export default function UptimePage() {
  const { data, isLoading } = useApi<Res>('stats/uptime', undefined, { refetchInterval: 30_000 });
  const apiChecks = (data?.checks ?? []).filter((c) => c.check_type === 'api').slice(0, 90).reverse();
  const pct = data?.api_uptime.uptime_pct ?? 100;

  return (
    <>
      <PageHeader title="Uptime" description="Health probes run every minute against the API and every active device (24-hour window)." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="API uptime" value={`${pct}%`} tone={pct >= 99 ? 'ok' : pct >= 95 ? 'warn' : 'bad'} loading={isLoading} />
        <StatCard label="API response" value={`${data?.api_uptime.avg_response_ms ?? 0} ms`} hint="average, database round-trip" loading={isLoading} />
        <StatCard label="Devices tracked" value={data?.device_uptime.length ?? 0} loading={isLoading} />
      </div>
      <Card className="mb-4">
        <CardHeader><CardTitle>Recent API probes</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-8 items-stretch gap-[2px]">
            {apiChecks.length === 0 && <span className="text-[13px] text-muted-foreground">No probes recorded yet — the cron job writes one per minute.</span>}
            {apiChecks.map((c, i) => (<div key={i} title={`${new Date(c.created_at).toLocaleTimeString()} — ${c.is_up ? 'up' : 'down'}`} className="min-w-[3px] flex-1 rounded-[2px]" style={{ background: c.is_up ? 'var(--st-delivered)' : 'var(--st-failed)' }} />))}
          </div>
        </CardContent>
      </Card>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="py-4"><CardTitle>Devices</CardTitle></CardHeader>
        <DataTable
          loading={isLoading} rows={data?.device_uptime} rowKey={(d) => d.target_id} empty="No device probes yet."
          columns={[
            { header: 'Device', cell: (d) => <span className="font-medium">{d.target_id}</span> },
            { header: 'Uptime', cell: (d) => (<div className="flex w-40 items-center gap-2"><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${d.uptime_pct}%`, background: d.uptime_pct >= 95 ? 'var(--st-delivered)' : d.uptime_pct >= 80 ? 'var(--st-pending)' : 'var(--st-failed)' }} /></div><span className="num w-14 text-right">{d.uptime_pct}%</span></div>) },
            { header: 'Checks', align: 'right', cell: (d) => <span className="num">{d.up_count}/{d.total_checks}</span> },
          ]}
        />
      </Card>
    </>
  );
}
