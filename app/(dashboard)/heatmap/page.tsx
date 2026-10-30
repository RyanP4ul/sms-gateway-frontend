'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/lib/hooks';

type Cell = { stat_date: string; stat_hour: number; sent_count: number; failed_count: number };

export default function HeatmapPage() {
  const [days, setDays] = useState('7');
  const { data, isLoading } = useApi<{ realtime_data: Cell[] }>('stats/heatmap', { days });

  const cells = new Map<string, Cell>((data?.realtime_data ?? []).map((c) => [`${c.stat_date}|${c.stat_hour}`, c]));
  const dates = [...new Set((data?.realtime_data ?? []).map((c) => c.stat_date))].sort();
  const max = Math.max(1, ...(data?.realtime_data ?? []).map((c) => c.sent_count + c.failed_count));

  return (
    <>
      <PageHeader
        title="Activity heatmap" description="Messages per hour of day — find your busy windows."
        actions={<div className="w-36"><NativeSelect value={days} onChange={(e) => setDays(e.target.value)}><option value="7">Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option></NativeSelect></div>}
      />
      <Card>
        <CardHeader><CardTitle>Sent + failed by hour</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && !data ? <Skeleton className="h-48 w-full" /> : dates.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted-foreground">No messages in this period.</p>
          ) : (
            <div className="min-w-[640px]">
              <div className="mb-1 ml-20 grid grid-cols-24 gap-[3px] text-[10px] text-muted-foreground" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                {Array.from({ length: 24 }).map((_, h) => (<div key={h} className="text-center">{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</div>))}
              </div>
              {dates.map((d) => (
                <div key={d} className="mb-[3px] flex items-center">
                  <div className="num w-20 shrink-0 text-xs text-muted-foreground">{d.slice(5)}</div>
                  <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                    {Array.from({ length: 24 }).map((_, h) => {
                      const c = cells.get(`${d}|${h}`);
                      const n = c ? c.sent_count + c.failed_count : 0;
                      return (
                        <div
                          key={h} className="aspect-square rounded-[3px] bg-muted"
                          style={n ? { background: `color-mix(in oklab, var(--primary) ${Math.max(14, (n / max) * 100)}%, var(--muted))` } : undefined}
                          title={`${d} ${String(h).padStart(2, '0')}:00 — ${c?.sent_count ?? 0} sent, ${c?.failed_count ?? 0} failed`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-4 ml-20 flex items-center gap-2 text-xs text-muted-foreground">
                less <div className="h-2.5 w-32 rounded-full" style={{ background: 'linear-gradient(90deg, var(--muted), var(--primary))' }} /> more <span className="num ml-2">(max {max}/h)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
