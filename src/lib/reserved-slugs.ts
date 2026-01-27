/**
 * Reserved slugs that cannot be used for community vanity URLs.
 * These are existing app routes that take precedence over dynamic slugs.
 */
export const RESERVED_SLUGS = [
  // App routes
  'about',
  'admin',
  'api',
  'auth',
  'communities',
  'create',
  'discover',
  'organizers',
  'privacy',
  'profile',
  'rides',
  'settings',
  'terms',
  'u',
  // Common reserved words
  'app',
  'help',
  'support',
  'contact',
  'blog',
  'news',
  'login',
  'signup',
  'register',
  'account',
  'dashboard',
  'home',
  'index',
  'static',
  'assets',
  'public',
  'images',
  'css',
  'js',
  'fonts',
  '_next',
  // Potential future routes
  'events',
  'clubs',
  'teams',
  'groups',
  'brands',
  'chapters',
  'members',
  'users',
  'search',
  'explore',
  'notifications',
  'messages',
  'inbox',
  'feed',
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

/**
 * Check if a slug is reserved and cannot be used for vanity URLs
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase() as ReservedSlug);
}
