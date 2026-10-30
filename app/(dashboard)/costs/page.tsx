'use client';

import { useState } from 'react';
import { DataTable } from '@/components/app/data-table';
import { PageHeader } from '@/components/app/page-header';
import { StatCard } from '@/components/app/stat-card';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { useApi } from '@/lib/hooks';
import { fmtNum } from '@/lib/utils';

type Res = { total_cost: number; total_sms: number; per_device: { device_id: string; device_name: string | null; cost_per_sms: number; total_cost: number; total_sms: number }[] };
const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

export default function CostsPage() {
  const [days, setDays] = useState('30');
  const { data, isLoading } = useApi<Res>('costs', { days });
  return (
    <>
      <PageHeader
        title="Costs" description="Spend is calculated daily from sent messages × each device’s cost per SMS (set on the Devices page)."
        actions={<div className="w-36"><NativeSelect value={days} onChange={(e) => setDays(e.target.value)}>{[7, 30, 60, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}</NativeSelect></div>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Total cost" value={money(data?.total_cost ?? 0)} loading={isLoading} />
        <StatCard label="Messages billed" value={fmtNum(data?.total_sms)} loading={isLoading} />
        <StatCard label="Average per SMS" value={data && data.total_sms ? money(data.total_cost / data.total_sms) : '—'} loading={isLoading} />
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <DataTable
          loading={isLoading} rows={data?.per_device} rowKey={(d) => d.device_id} empty="No cost data yet."
          columns={[
            { header: 'Device', cell: (d) => <span className="font-medium">{d.device_name || d.device_id}</span> },
            { header: 'Rate / SMS', align: 'right', cell: (d) => <span className="num">{money(d.cost_per_sms)}</span> },
            { header: 'Messages', align: 'right', cell: (d) => <span className="num">{fmtNum(d.total_sms)}</span> },
            { header: 'Cost', align: 'right', cell: (d) => <span className="num font-medium">{money(d.total_cost)}</span> },
          ]}
        />
      </Card>
    </>
  );
}
