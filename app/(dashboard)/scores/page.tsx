'use client';

import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { StatusBadge } from '@/components/app/status-badge';
import { Card } from '@/components/ui/card';
import { useApi } from '@/lib/hooks';
import { fmtNum, timeAgo } from '@/lib/utils';

type Res = {
  devices: { device_id: string; device_name: string | null; performance_score: number; total_sent: number; total_failed: number; weight: number; last_seen: string | null; success_rate: number; is_online: boolean }[];
  history: { device_id: string; score: number; recorded_at: string }[];
};

function Spark({ points }: { points: number[] }) {
  if (points.length < 2) return <span className="text-xs text-muted-foreground">not enough data</span>;
  const w = 96, h = 24;
  const path = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - (v / 100) * h}`).join(' ');
  return <svg width={w} height={h} className="overflow-visible"><polyline points={path} fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

const scoreColor = (s: number) => (s >= 80 ? 'var(--st-delivered)' : s >= 50 ? 'var(--st-pending)' : 'var(--st-failed)');

export default function ScoresPage() {
  const { data, isLoading } = useApi<Res>('devices/scores', undefined, { refetchInterval: 30_000 });
  return (
    <>
      <PageHeader title="Device scores" description="Recomputed every minute: 60% delivery success (24 h) + 40% uptime (24 h). The sparkline shows the last 7 days." />
      <Card className="gap-0 overflow-hidden py-0">
        <DataTable
          loading={isLoading} rows={data?.devices} rowKey={(d) => d.device_id} empty="No devices."
          columns={[
            { header: 'Device', cell: (d) => (<div><div className="font-medium">{d.device_name || d.device_id}</div><StatusBadge status={d.is_online ? 'online' : 'offline'} className="mt-0.5" /></div>) },
            { header: 'Score', cell: (d) => (<div className="flex w-36 items-center gap-2"><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${d.performance_score}%`, background: scoreColor(d.performance_score) }} /></div><span className="num w-8 text-right font-semibold">{d.performance_score}</span></div>) },
            { header: '7-day trend', cell: (d) => <Spark points={(data?.history ?? []).filter((h) => h.device_id === d.device_id).map((h) => h.score)} /> },
            { header: 'Success', align: 'right', cell: (d) => <span className="num">{d.success_rate}%</span> },
            { header: 'Sent / failed', align: 'right', cell: (d) => <span className="num">{fmtNum(d.total_sent)} / <span className="text-st-failed">{fmtNum(d.total_failed)}</span></span> },
            { header: 'Weight', align: 'right', cell: (d) => <span className="num">{d.weight}</span> },
            { header: 'Last seen', cell: (d) => <span className="text-muted-foreground">{timeAgo(d.last_seen)}</span> },
          ]}
        />
      </Card>
    </>
  );
}
