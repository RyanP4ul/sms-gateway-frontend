import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function StatCard({
  label, value, hint, tone, loading,
}: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'ok' | 'warn' | 'bad'; loading?: boolean }) {
  return (
    <Card className="gap-1.5 py-4">
      <div className="px-5 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="px-5">
        {loading ? (
          <Skeleton className="mt-1 h-8 w-20" />
        ) : (
          <div className={cn('num text-2xl font-semibold tracking-tight', tone === 'ok' && 'text-st-delivered', tone === 'warn' && 'text-st-pending', tone === 'bad' && 'text-st-failed')}>
            {value}
          </div>
        )}
      </div>
      {hint && <div className="px-5 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
