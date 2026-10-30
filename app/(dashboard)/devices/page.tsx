'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, History, Pencil, Trash2 } from 'lucide-react';
import { ConfirmButton } from '@/components/app/confirm-button';
import { DataTable } from '@/components/app/data-table';
import { Field } from '@/components/app/field';
import { PageHeader } from '@/components/app/page-header';
import { SecretDialog } from '@/components/app/secret-dialog';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAction, useApi } from '@/lib/hooks';
import { api } from '@/lib/api';
import type { Device } from '@/lib/types';
import { fmtDate, fmtNum, timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

type Health = { threshold_secs: number; devices: { device_id: string; health_status: 'online' | 'offline' | 'never_connected' }[] };
type KeyHistory = { history: { id: number; api_key_prefix: string; is_active: boolean; expires_at: string | null; rotated_at: string | null }[] };

function EditDialog({ device, onClose }: { device: Device; onClose: () => void }) {
  const qc = useQueryClient();
  const [cost, setCost] = useState(String(device.cost_per_sms));
  const [weight, setWeight] = useState(String(device.weight));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api('devices/cost', { body: { device_id: device.device_id, cost_per_sms: Number(cost) } });
      await api('devices/weight', { body: { device_id: device.device_id, weight: Number(weight) } });
      toast.success('Device updated');
      qc.invalidateQueries({ queryKey: ['devices'] });
      onClose();
    } catch (e: any) {
      toast.error(e.full ?? e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{device.device_name || device.device_id}</DialogTitle><DialogDescription>Tuning for load balancing and cost reports.</DialogDescription></DialogHeader>
        <Field label="Load-balancing weight (1–100)" hint="Used by the Weighted distribution strategy."><Input type="number" min={1} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} /></Field>
        <Field label="Cost per SMS" hint="Same currency as your cost reports."><Input type="number" min={0} step="0.0001" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={busy || !cost || !weight} onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistoryDialog({ deviceId, onClose }: { deviceId: string | null; onClose: () => void }) {
  const { data, isLoading } = useApi<KeyHistory>('devices/key-history', { device_id: deviceId ?? undefined }, { enabled: !!deviceId });
  return (
    <Dialog open={!!deviceId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>API key history</DialogTitle><DialogDescription>Previous keys keep working for 24 hours after rotation.</DialogDescription></DialogHeader>
        <DataTable
          loading={isLoading} rows={data?.history} rowKey={(h) => h.id} empty="This device has never rotated its key."
          columns={[
            { header: 'Key', cell: (h) => <span className="font-mono text-xs">{h.api_key_prefix}…</span> },
            { header: 'Rotated', cell: (h) => fmtDate(h.rotated_at) },
            { header: 'Grace until', cell: (h) => fmtDate(h.expires_at) },
            { header: 'State', cell: (h) => <StatusBadge status={h.is_active && h.expires_at && new Date(h.expires_at) > new Date() ? 'active' : 'expired'} /> },
          ]}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function DevicesPage() {
  const { data, isLoading } = useApi<{ devices: Device[] }>('devices', undefined, { refetchInterval: 15_000 });
  const health = useApi<Health>('devices/health', undefined, { refetchInterval: 15_000 });
  const [editing, setEditing] = useState<Device | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const toggle = useAction<{ device_id: string; is_active: boolean }>('devices/toggle', { invalidate: ['devices', 'devices/health'] });
  const remove = useAction<string>((id) => `devices/${encodeURIComponent(id)}`, { method: 'DELETE', invalidate: ['devices', 'devices/health', 'stats'] });
  const rotate = useAction<{ device_id: string }, { new_api_key: string }>('devices/rotate-key', { invalidate: ['devices'], success: 'API key rotated', onDone: (r) => setNewKey(r.new_api_key) });

  const healthOf = (id: string) => health.data?.devices.find((d) => d.device_id === id)?.health_status ?? 'never_connected';

  return (
    <>
      <PageHeader title="Devices" description="Phones acting as SIM gateways. New devices register themselves from the Android app using the registration secret." />
      <Card className="gap-0 overflow-hidden py-0">
        <DataTable
          loading={isLoading} rows={data?.devices} rowKey={(d) => d.device_id} empty="No devices registered yet."
          columns={[
            { header: 'Device', cell: (d) => (<div><div className="font-medium">{d.device_name || d.device_id}</div><div className="font-mono text-xs text-muted-foreground">{d.device_id}{d.device_model ? ` · ${[d.device_brand, d.device_model].filter(Boolean).join(' ')}` : ''}</div></div>) },
            { header: 'Health', cell: (d) => (<div><StatusBadge status={healthOf(d.device_id)} /><div className="mt-0.5 text-xs text-muted-foreground">{timeAgo(d.last_seen)}</div></div>) },
            { header: 'Active', cell: (d) => <Switch checked={d.is_active} onCheckedChange={(v) => toggle.mutate({ device_id: d.device_id, is_active: v })} aria-label="Toggle device" /> },
            { header: 'Score', align: 'right', cell: (d) => <span className="num">{d.performance_score}</span> },
            { header: 'Weight', align: 'right', cell: (d) => <span className="num">{d.weight}</span> },
            { header: 'Queue', align: 'right', cell: (d) => <span className="num"><span className="text-st-pending">{fmtNum(d.pending_count)}</span> / <span className="text-st-sent">{fmtNum(d.sent_count)}</span> / <span className="text-st-failed">{fmtNum(d.failed_count)}</span></span> },
            {
              header: '', align: 'right', cell: (d) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon-sm" title="Edit weight & cost" onClick={() => setEditing(d)}><Pencil /></Button>
                  <Button variant="ghost" size="icon-sm" title="Key history" onClick={() => setHistoryFor(d.device_id)}><History /></Button>
                  <ConfirmButton variant="ghost" size="icon-sm" destructive={false} title="Rotate API key?" description="A new key is generated. The old key keeps working for 24 hours so the phone can update." confirmLabel="Rotate" onConfirm={() => rotate.mutate({ device_id: d.device_id })}><KeyRound /></ConfirmButton>
                  <ConfirmButton variant="ghost" size="icon-sm" title="Delete device?" description="The device is removed and its pending messages are cancelled." confirmLabel="Delete" onConfirm={() => remove.mutate(d.device_id)}><Trash2 className="text-destructive" /></ConfirmButton>
                </div>
              ),
            },
          ]}
        />
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">Offline = no contact for {health.data?.threshold_secs ?? 300}s. Queue column: pending / sent / failed.</p>

      {editing && <EditDialog key={editing.device_id} device={editing} onClose={() => setEditing(null)} />}
      <HistoryDialog deviceId={historyFor} onClose={() => setHistoryFor(null)} />
      <SecretDialog title="New API key" description="Copy it now — only a hash is stored, so it can't be shown again. Enter it in the Android app." value={newKey} onClose={() => setNewKey(null)} />
    </>
  );
}
