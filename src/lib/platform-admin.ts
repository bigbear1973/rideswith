import { Session } from 'next-auth';

export const PLATFORM_ADMIN_ROLE = 'PLATFORM_ADMIN';

/**
 * Check if the current user is a platform admin
 */
export function isPlatformAdmin(session: Session | null): boolean {
  return session?.user?.role === PLATFORM_ADMIN_ROLE;
}

/**
 * Check if sponsors are available for a community
 * Returns true if:
 * - The community has sponsorsEnabled = true, OR
 * - The user is a platform admin (can always manage sponsors)
 */
export function canManageSponsors(
  session: Session | null,
  sponsorsEnabled: boolean
): boolean {
  if (isPlatformAdmin(session)) {
    return true;
  }
  return sponsorsEnabled;
}
