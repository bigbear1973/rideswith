/**
 * Geocoding service using OpenStreetMap Nominatim (free, no API key needed)
 */

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
  };
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string | null;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'RidesWithTelegramBot/1.0 (contact@rideswith.com)';

/**
 * Search for a location by name
 */
export async function geocodeLocation(query: string): Promise<GeocodingResult | null> {
  try {
    const url = new URL('/search', NOMINATIM_BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const results = (await response.json()) as NominatimResult[];

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const city =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.municipality ||
      null;

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      city,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get location name
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  try {
    const url = new URL('/reverse', NOMINATIM_BASE_URL);
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lon', longitude.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return null;
    }

    const result = (await response.json()) as NominatimResult;

    const city =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.municipality ||
      null;

    return {
      latitude,
      longitude,
      displayName: result.display_name,
      city,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
