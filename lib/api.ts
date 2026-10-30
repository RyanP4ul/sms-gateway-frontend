/** Browser-side API client. Every call goes through the same-origin Next.js proxy (/api/proxy/*), which attaches the admin token from an httpOnly cookie. */

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: string[]) {
    super(message);
  }
  /** Message plus validation details, ready for a toast. */
  get full() {
    return this.details?.length ? `${this.message}: ${this.details.join('; ')}` : this.message;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, query?: Query): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  const s = qs.toString();
  return `/api/proxy/${path.replace(/^\//, '')}${s ? `?${s}` : ''}`;
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; query?: Query } = {}): Promise<T> {
  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
    headers: opts.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
  }

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON body */ }

  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText ?? 'Request failed', data?.details);
  return data as T;
}
