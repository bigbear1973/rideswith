import { config } from '../config.js';

export interface RideResponse {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endTime: string | null;
  locationName: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  elevation: number | null;
  pace: string;
  paceMin: number | null;
  paceMax: number | null;
  terrain: string | null;
  maxAttendees: number | null;
  isFree: boolean;
  price: number | null;
  routeUrl: string | null;
  organizer: {
    id: string;
    name: string;
    slug: string;
  };
  brand: {
    name: string;
    slug: string;
    logo: string | null;
    logoIcon: string | null;
    primaryColor: string | null;
  } | null;
  attendeeCount: number;
}

export interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  dateFrom?: string;
  dateTo?: string;
  paceMin?: number;
  paceMax?: number;
  chapterId?: string;
  brandSlug?: string;
  limit?: number;
}

/**
 * Fetch rides from the RidesWith API
 */
export async function searchRides(params: SearchParams = {}): Promise<RideResponse[]> {
  try {
    const url = new URL(`${config.ridesWithApiUrl}/rides`);

    // Add query parameters
    if (params.lat !== undefined) url.searchParams.set('lat', params.lat.toString());
    if (params.lng !== undefined) url.searchParams.set('lng', params.lng.toString());
    if (params.radius !== undefined) url.searchParams.set('radius', params.radius.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('RidesWith API error:', response.status);
      return [];
    }

    let rides = (await response.json()) as RideResponse[];

    // Client-side filtering for additional params (until API supports them)
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      rides = rides.filter((r) => new Date(r.date) >= fromDate);
    }

    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999);
      rides = rides.filter((r) => new Date(r.date) <= toDate);
    }

    if (params.paceMin !== undefined) {
      rides = rides.filter((r) => {
        if (r.paceMin !== null) return r.paceMin >= params.paceMin!;
        if (r.paceMax !== null) return r.paceMax >= params.paceMin!;
        return true; // Include rides without pace info
      });
    }

    if (params.paceMax !== undefined) {
      rides = rides.filter((r) => {
        if (r.paceMax !== null) return r.paceMax <= params.paceMax!;
        if (r.paceMin !== null) return r.paceMin <= params.paceMax!;
        return true;
      });
    }

    if (params.brandSlug) {
      rides = rides.filter(
        (r) => r.brand?.slug?.toLowerCase() === params.brandSlug?.toLowerCase()
      );
    }

    // Apply limit
    if (params.limit) {
      rides = rides.slice(0, params.limit);
    }

    return rides;
  } catch (error) {
    console.error('RidesWith API error:', error);
    return [];
  }
}

/**
 * Get a single ride by ID
 */
export async function getRide(id: string): Promise<RideResponse | null> {
  try {
    const response = await fetch(`${config.ridesWithApiUrl}/rides/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as RideResponse;
  } catch (error) {
    console.error('RidesWith API error:', error);
    return null;
  }
}

/**
 * Build the URL for a ride detail page
 */
export function getRideUrl(rideId: string): string {
  return `${config.ridesWithBaseUrl}/rides/${rideId}`;
}
