import { cn } from '@/lib/utils';

/** Tiny dependency-free bar chart. Each datum may carry a stacked `secondary` value (e.g. failed on top of sent). */
export function Bars({
  data, height = 120, primaryLabel = 'sent', secondaryLabel = 'failed', className,
}: { data: { label: string; value: number; secondary?: number }[]; height?: number; primaryLabel?: string; secondaryLabel?: string; className?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value + (d.secondary ?? 0)));
  if (!data.length) return <div className="py-8 text-center text-[13px] text-muted-foreground">No data for this period.</div>;
  return (
    <div className={className}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${d.label}: ${d.value} ${primaryLabel}${d.secondary ? `, ${d.secondary} ${secondaryLabel}` : ''}`}>
            {!!d.secondary && <div className="w-full rounded-t-[3px] bg-st-failed" style={{ height: `${(d.secondary / max) * 100}%` }} />}
            <div className={cn('w-full bg-st-delivered', d.secondary ? '' : 'rounded-t-[3px]')} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 text-[10px] text-muted-foreground">
        {data.map((d) => (<div key={d.label} className="min-w-0 flex-1 truncate text-center">{d.label}</div>))}
      </div>
    </div>
  );
}
