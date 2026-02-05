import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales } from './src/i18n/routing';

// Minimal locale-aware routing without moving existing pages.
// Assumption: We want /en/* and /de/* to work while keeping current routes intact.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next internals and API routes.
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const pathParts = pathname.split('/');
  const maybeLocale = pathParts[1];
  const hasLocale = locales.includes(maybeLocale as (typeof locales)[number]);
  const locale = hasLocale ? maybeLocale : defaultLocale;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-next-intl-locale', locale);

  if (hasLocale) {
    const strippedPath = `/${pathParts.slice(2).join('/')}` || '/';
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = strippedPath === '/' ? '/' : strippedPath.replace(/\/+$/, '');
    return NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
