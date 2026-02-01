import type { RideResponse } from '../services/rideswith-api.js';

/**
 * Format a date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  let relative = '';
  if (diffDays === 0) {
    relative = 'Today';
  } else if (diffDays === 1) {
    relative = 'Tomorrow';
  } else if (diffDays <= 7) {
    relative = `in ${diffDays} days`;
  }

  return `${dayName}, ${monthDay} · ${time}${relative ? ` (${relative})` : ''}`;
}

/**
 * Format pace range for display
 */
export function formatPace(paceMin: number | null, paceMax: number | null): string {
  if (paceMin && paceMax) {
    return `${paceMin}-${paceMax} km/h`;
  } else if (paceMin) {
    return `${paceMin}+ km/h`;
  } else if (paceMax) {
    return `Up to ${paceMax} km/h`;
  }
  return '';
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number | null): string {
  if (distance === null) return '';
  return `${distance} km`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format a single ride for Telegram display
 */
export function formatRide(
  ride: RideResponse,
  userLat?: number,
  userLng?: number,
  includeLink?: boolean
): string {
  const lines: string[] = [];

  // Title
  lines.push(`📍 <b>${escapeHtml(ride.title)}</b>`);

  // Date and time
  lines.push(`⏰ ${formatDate(ride.date)}`);

  // Location with distance if we have user coords
  let locationLine = `📍 ${escapeHtml(ride.locationName)}`;
  if (userLat !== undefined && userLng !== undefined) {
    const dist = calculateDistance(userLat, userLng, ride.latitude, ride.longitude);
    locationLine += ` · ${Math.round(dist)} km away`;
  }
  lines.push(locationLine);

  // Pace and distance
  const paceStr = formatPace(ride.paceMin, ride.paceMax);
  const distStr = formatDistance(ride.distance);
  if (paceStr || distStr) {
    const parts: string[] = [];
    if (paceStr) parts.push(`🏃 ${paceStr}`);
    if (distStr) parts.push(distStr);
    lines.push(parts.join(' · '));
  }

  // Community/Brand
  if (ride.brand) {
    lines.push(`🏢 ${escapeHtml(ride.brand.name)}`);
  }

  // Attendees
  let attendeeLine = `👥 ${ride.attendeeCount} going`;
  if (ride.maxAttendees) {
    const spotsLeft = ride.maxAttendees - ride.attendeeCount;
    if (spotsLeft > 0) {
      attendeeLine += ` · ${spotsLeft} spots left`;
    } else {
      attendeeLine += ' · FULL';
    }
  }
  lines.push(attendeeLine);

  // Include link if requested
  if (includeLink) {
    lines.push(`🔗 <a href="https://rideswith.com/rides/${ride.id}">View ride</a>`);
  }

  return lines.join('\n');
}

/**
 * Format multiple rides for Telegram display
 */
export function formatRideList(
  rides: RideResponse[],
  locationName?: string,
  userLat?: number,
  userLng?: number
): string {
  if (rides.length === 0) {
    return '🚴 No rides found matching your search.\n\nTry broadening your search or check back later for new rides!';
  }

  const header = locationName
    ? `🚴 Found ${rides.length} ride${rides.length === 1 ? '' : 's'} near ${escapeHtml(locationName)}:`
    : `🚴 Found ${rides.length} ride${rides.length === 1 ? '' : 's'}:`;

  const rideBlocks = rides.map((ride) => {
    const formatted = formatRide(ride, userLat, userLng, true);
    return `━━━━━━━━━━━━━━━\n${formatted}`;
  });

  return `${header}\n${rideBlocks.join('\n')}\n━━━━━━━━━━━━━━━`;
}

/**
 * Escape HTML special characters for Telegram HTML mode
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Get date strings for relative date ranges
 */
export function getDateRange(
  relative: 'today' | 'tomorrow' | 'this_weekend' | 'next_week' | 'this_week'
): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const toIsoDate = (d: Date) => d.toISOString().split('T')[0];

  switch (relative) {
    case 'today':
      return { from: toIsoDate(today), to: toIsoDate(today) };

    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { from: toIsoDate(tomorrow), to: toIsoDate(tomorrow) };
    }

    case 'this_weekend': {
      // Saturday and Sunday of this week
      const saturday = new Date(today);
      const dayOfWeek = saturday.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      saturday.setDate(saturday.getDate() + daysUntilSaturday);
      const sunday = new Date(saturday);
      sunday.setDate(sunday.getDate() + 1);
      return { from: toIsoDate(saturday), to: toIsoDate(sunday) };
    }

    case 'this_week': {
      // Rest of this week (through Sunday)
      const sunday = new Date(today);
      const dayOfWeek = sunday.getDay();
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      sunday.setDate(sunday.getDate() + daysUntilSunday);
      return { from: toIsoDate(today), to: toIsoDate(sunday) };
    }

    case 'next_week': {
      // Monday through Sunday of next week
      const nextMonday = new Date(today);
      const dayOfWeek = nextMonday.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextSunday.getDate() + 6);
      return { from: toIsoDate(nextMonday), to: toIsoDate(nextSunday) };
    }
  }
}
