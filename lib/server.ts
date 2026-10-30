import 'server-only';

import { COOKIE_NAME } from './constants';

export const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://localhost:3001').replace(/\/$/, '');
export { COOKIE_NAME };
export const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  // Set COOKIE_SECURE=false if you serve the dashboard over plain http on a LAN.
  secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

/**
 * Forward the visitor's X-Forwarded-For to the API (so it can rate-limit per real client).
 * ONLY enable when a reverse proxy you control (nginx, Traefik, Cloudflare…) sits in front of this app
 * and overwrites that header — otherwise any visitor could spoof it to dodge the login rate limit.
 */
export const FORWARD_CLIENT_IP = process.env.TRUST_PROXY_HEADERS === 'true';
