import { ChapterRole } from '@prisma/client';

/**
 * Normalize legacy role values to new role system
 * LEAD -> OWNER
 * AMBASSADOR -> MODERATOR
 */
export function normalizeRole(role: ChapterRole): 'OWNER' | 'ADMIN' | 'MODERATOR' {
  switch (role) {
    case 'LEAD':
      return 'OWNER';
    case 'AMBASSADOR':
      return 'MODERATOR';
    case 'OWNER':
    case 'ADMIN':
    case 'MODERATOR':
      return role;
    default:
      return 'MODERATOR';
  }
}

/**
 * Check if a role has owner-level permissions
 * OWNER or LEAD (legacy) have full control
 */
export function isOwner(role: ChapterRole): boolean {
  return role === 'OWNER' || role === 'LEAD';
}

/**
 * Check if a role has admin-level permissions
 * OWNER, ADMIN, or LEAD (legacy) can manage members
 */
export function isAdmin(role: ChapterRole): boolean {
  return role === 'OWNER' || role === 'ADMIN' || role === 'LEAD';
}

/**
 * Check if a role has moderator-level permissions
 * All roles have at least moderator permissions
 */
export function isModerator(role: ChapterRole): boolean {
  return ['OWNER', 'ADMIN', 'MODERATOR', 'LEAD', 'AMBASSADOR'].includes(role);
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: ChapterRole): string {
  switch (normalizeRole(role)) {
    case 'OWNER':
      return 'Owner';
    case 'ADMIN':
      return 'Admin';
    case 'MODERATOR':
      return 'Moderator';
    default:
      return 'Member';
  }
}
