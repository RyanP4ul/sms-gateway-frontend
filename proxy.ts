import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME } from './lib/constants';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/login' || pathname === '/status') {
    return NextResponse.next();
  }

  if (!request.cookies.get(COOKIE_NAME)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
