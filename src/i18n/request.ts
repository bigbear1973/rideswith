import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Assume a single "common" namespace for minimal scaffolding.
  const locale = (await requestLocale) || defaultLocale;
  const safeLocale = locales.includes(locale as (typeof locales)[number])
    ? locale
    : defaultLocale;

  return {
    locale: safeLocale,
    messages: (await import(`../../locales/${safeLocale}/common.json`)).default,
  };
});
