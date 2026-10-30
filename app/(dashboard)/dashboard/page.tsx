'use client';

import { useEffect, useState } from 'react';
import { Bars } from '@/components/app/bars';
import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { StatusBadge, statusColor } from '@/components/app/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi } from '@/lib/hooks';
import { cn, fmtNum, timeAgo } from '@/lib/utils';

type Counts = Record<'total' | 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled', number>;
type Stats = {
  overall: Counts; today: { total: number; sent: number; failed: number };
  weekly_trend: { date: string; total: number; sent: number; failed: number }[];
  per_device: { device_id: string; device_name: string | null; is_active: boolean; last_seen: string | null; total_sms: number; sent: number; failed: number }[];
  active_devices: number;
};
type Health = { online_count: number; offline_count: number };
type Live = { stats: { total: number; pending: number; sent: number; failed: number }; online_devices: number; recent: { id: number; device_id: string; phone_number: string; status: string; created_at: string }[] };

const PIPELINE = ['pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled'] as const;

/** Subscribes to the API's server-sent-events stream; reconnects when the server ends it (every 5 min) or on error. */
function useLive() {
  const [live, setLive] = useState<Live | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let es: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const open = () => {
      es = new EventSource('/api/proxy/stats/stream');
      es.onopen = () => setConnected(true);
      es.onmessage = (e) => setLive(JSON.parse(e.data));
      es.addEventListener('close', () => { es?.close(); timer = setTimeout(open, 500); });
      es.onerror = () => { setConnected(false); es?.close(); if (!stopped) timer = setTimeout(open, 5000); };
    };
    open();
    return () => { stopped = true; clearTimeout(timer); es?.close(); };
  }, []);
  return { live, connected };
}

export default function DashboardPage() {
  const stats = useApi<Stats>('stats', undefined, { refetchInterval: 20_000 });
  const health = useApi<Health>('devices/health', undefined, { refetchInterval: 20_000 });
  const { live, connected } = useLive();

  const o = stats.data?.overall;
  const total = Math.max(1, o?.total ?? 0);
  const today = live?.stats ?? stats.data?.today;
  const failRate = today && today.sent + today.failed > 0 ? Math.round((today.failed / (today.sent + today.failed)) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything the gateway has queued, sent and received."
        actions={
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', connected ? 'animate-pulse bg-st-delivered' : 'bg-st-cancelled')} />
            {connected ? 'Live' : 'Reconnecting…'}
          </span>
        }
      />

      {/* The pipeline: where every message is right now */}
      <Card className="mb-4">
        <CardHeader><CardTitle>Message pipeline</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {o && PIPELINE.map((s) => o[s] > 0 && (
              <div key={s} title={`${s}: ${o[s].toLocaleString()}`} className="h-full transition-[width] duration-500" style={{ width: `${(o[s] / total) * 100}%`, background: statusColor(s) }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            {PIPELINE.map((s) => (
              <div key={s}>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground capitalize"><span className="size-2 rounded-sm" style={{ background: statusColor(s) }} />{s}</div>
                <div className="num text-lg font-semibold">{stats.isLoading ? '—' : fmtNum(o?.[s])}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sent today" value={fmtNum(today?.sent)} hint={`${fmtNum(today?.total)} created`} loading={!today} />
        <StatCard label="Failed today" value={fmtNum(today?.failed)} hint={`${failRate}% failure rate`} tone={failRate > 30 ? 'bad' : failRate > 10 ? 'warn' : undefined} loading={!today} />
        <StatCard label="Queue waiting" value={fmtNum(live?.stats.pending ?? o?.pending)} hint={`${fmtNum(o?.processing)} in flight`} tone={(o?.pending ?? 0) > 500 ? 'warn' : undefined} loading={!o} />
        <StatCard
          label="Devices online" value={health.data ? `${health.data.online_count}/${health.data.online_count + health.data.offline_count}` : '—'}
          hint={`${stats.data?.active_devices ?? 0} active`} tone={health.data && health.data.offline_count > 0 ? 'warn' : 'ok'} loading={!health.data}
        />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Last 7 days</CardTitle></CardHeader>
          <CardContent>
            <Bars data={(stats.data?.weekly_trend ?? []).map((d) => ({ label: d.date.slice(5), value: d.sent, secondary: d.failed }))} height={140} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Latest activity</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {(live?.recent ?? []).length === 0 && <p className="py-6 text-center text-[13px] text-muted-foreground">Waiting for activity…</p>}
            {live?.recent.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-[13px]">
                <div className="min-w-0">
                  <div className="num truncate font-mono text-xs">{m.phone_number}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.device_id} · {timeAgo(m.created_at)}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="py-4"><CardTitle>Per device</CardTitle></CardHeader>
        <DataTable
          loading={stats.isLoading}
          rows={stats.data?.per_device}
          rowKey={(d) => d.device_id}
          columns={[
            { header: 'Device', cell: (d) => (<div><div className="font-medium">{d.device_name || d.device_id}</div><div className="font-mono text-xs text-muted-foreground">{d.device_id}</div></div>) },
            { header: 'State', cell: (d) => <StatusBadge status={d.is_active ? 'active' : 'inactive'} /> },
            { header: 'Last seen', cell: (d) => <span className="text-muted-foreground">{timeAgo(d.last_seen)}</span> },
            { header: 'Total', align: 'right', cell: (d) => <span className="num">{fmtNum(d.total_sms)}</span> },
            { header: 'Sent', align: 'right', cell: (d) => <span className="num text-st-sent">{fmtNum(d.sent)}</span> },
            { header: 'Failed', align: 'right', cell: (d) => <span className="num text-st-failed">{fmtNum(d.failed)}</span> },
          ]}
          empty="No devices registered yet."
        />
      </Card>
    </>
  );
}
