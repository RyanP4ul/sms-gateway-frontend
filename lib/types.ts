/** Response shapes used by the dashboard (subset of what the API returns). */
export type SmsStatus = 'pending' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled';

export type Device = {
  device_id: string; device_name: string | null; phone_number: string | null; api_key_prefix: string; is_active: boolean;
  last_seen: string | null; performance_score: number; weight: number; cost_per_sms: number; sim_slot: number;
  device_model: string | null; device_brand: string | null; android_version: string | null; app_version: string | null;
  pending_count: number; sent_count: number; failed_count: number; created_at: string;
};

export type Paged = { total: number; page: number; limit: number; total_pages: number };
export type SmsRow = { id: number; device_id: string; phone_number: string; status: SmsStatus; priority: number; batch_id: string | null; sent_at: string | null; created_at: string };
