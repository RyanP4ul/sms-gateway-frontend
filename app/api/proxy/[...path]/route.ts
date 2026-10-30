import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { BACKEND_URL, COOKIE_NAME, FORWARD_CLIENT_IP } from '@/lib/server';

// export const dynamic = 'force-dynamic';

const PASS_THROUGH = ['content-type', 'content-disposition', 'retry-after', 'x-ratelimit-limit', 'x-ratelimit-remaining'];

/**
 * Same-origin proxy to the Elysia API. The browser only ever sees /api/proxy/*; the admin token
 * is read from the httpOnly cookie here and attached server-side. SSE responses are streamed through.
 */
async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return Response.json({ error: 'Login required' }, { status: 401 });

  // CSRF defence in depth (the cookie is already SameSite=Strict): state-changing requests must be same-origin.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const origin = req.headers.get('origin');
    if (origin && new URL(origin).host !== req.headers.get('host')) return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { path } = await ctx.params;
  const url = `${BACKEND_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers({ 'x-admin-token': token });
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd && FORWARD_CLIENT_IP) headers.set('x-forwarded-for', fwd);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      signal: req.signal,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json({ error: 'API sunucusuna ulaşılamıyor' }, { status: 502 });
  }

  const out = new Headers({ 'cache-control': 'no-store' });
  for (const h of PASS_THROUGH) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  if (upstream.headers.get('content-type')?.includes('text/event-stream')) out.set('x-accel-buffering', 'no');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { handler as GET, handler as POST, handler as DELETE };
