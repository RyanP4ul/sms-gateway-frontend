import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { BACKEND_URL, COOKIE_NAME, FORWARD_CLIENT_IP, cookieOptions } from '@/lib/server';

/** Verifies the admin token against the API, then stores it in an httpOnly cookie (never exposed to page JS). */
export async function POST(req: NextRequest) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token) return Response.json({ error: 'Token gerekli' }, { status: 400 });

  const headers: Record<string, string> = { 'x-admin-token': token };
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd && FORWARD_CLIENT_IP) headers['x-forwarded-for'] = fwd;

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/auth/me`, { headers, cache: 'no-store' });
  } catch {
    return Response.json({ error: 'API sunucusuna ulaşılamıyor' }, { status: 502 });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return Response.json({ error: body.error ?? 'Geçersiz token' }, { status: res.status === 429 ? 429 : 401 });
  }

  (await cookies()).set(COOKIE_NAME, token, cookieOptions);
  return Response.json({ success: true });
}
