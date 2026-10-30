import { cn } from '@/lib/utils';

/** One colour language across the app: amber = waiting, blue = in flight, teal = sent, green = delivered/ok, red = failed. */
const TONES: Record<string, string> = {
  // sms
  pending: 'st-pending', processing: 'st-processing', sent: 'st-sent', delivered: 'st-delivered', failed: 'st-failed', cancelled: 'st-cancelled',
  // device health
  online: 'st-delivered', offline: 'st-failed', never_connected: 'st-cancelled',
  // commands
  executed: 'st-delivered', expired: 'st-cancelled',
  // components & incidents
  operational: 'st-delivered', degraded: 'st-pending', partial_outage: 'st-pending', major_outage: 'st-failed', maintenance: 'st-processing',
  investigating: 'st-failed', identified: 'st-pending', monitoring: 'st-processing', resolved: 'st-delivered',
  minor: 'st-pending', major: 'st-pending', critical: 'st-failed',
  active: 'st-delivered', inactive: 'st-cancelled',
};

const CLASS: Record<string, string> = {
  'st-pending': 'bg-st-pending/12 text-st-pending',
  'st-processing': 'bg-st-processing/10 text-st-processing',
  'st-sent': 'bg-st-sent/10 text-st-sent',
  'st-delivered': 'bg-st-delivered/10 text-st-delivered',
  'st-failed': 'bg-st-failed/10 text-st-failed',
  'st-cancelled': 'bg-st-cancelled/12 text-st-cancelled',
};

export const statusColor = (s: string) => `var(--${TONES[s] ?? 'st-cancelled'})`;

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  const tone = CLASS[TONES[status] ?? 'st-cancelled'];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap', tone, className)}>
      <span className="size-1.5 rounded-full" style={{ background: statusColor(status) }} />
      {label ?? status.replaceAll('_', ' ')}
    </span>
  );
}
