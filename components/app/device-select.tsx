'use client';

import { NativeSelect } from '@/components/ui/native-select';
import { useApi } from '@/lib/hooks';
import type { Device } from '@/lib/types';

export function useDevices() {
  return useApi<{ devices: Device[] }>('devices');
}

/** Dropdown of registered devices. `all` adds an "All devices" option with an empty value. */
export function DeviceSelect({ value, onChange, all, className }: { value: string; onChange: (v: string) => void; all?: boolean; className?: string }) {
  const { data } = useDevices();
  return (
    <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      {all ? <option value="">All devices</option> : <option value="" disabled>Select a device…</option>}
      {data?.devices.map((d) => (
        <option key={d.device_id} value={d.device_id}>{d.device_name || d.device_id}{d.is_active ? '' : ' (inactive)'}</option>
      ))}
    </NativeSelect>
  );
}
