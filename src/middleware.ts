import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - static files (_next/static)
    // - image optimization files (_next/image)
    // - favicon.ico
    // - auth routes
    '/((?!api|_next/static|_next/image|favicon.ico|\\(auth\\)).*)'
  ]
};