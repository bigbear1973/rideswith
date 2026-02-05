import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './src/i18n/routing';

export default createMiddleware({
  locales,
  defaultLocale,
  // Keep default locale accessible at "/" while enabling "/de" and "/en".
  localePrefix: 'as-needed',
});

export const config = {
  // Match all pathnames except for API routes, static files, and Next internals.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
