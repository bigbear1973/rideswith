/**
 * Strava API Integration
 *
 * OAuth 2.0 flow and API client for Strava club event sync.
 *
 * Environment variables required:
 * - STRAVA_CLIENT_ID
 * - STRAVA_CLIENT_SECRET
 * - STRAVA_REDIRECT_URI (defaults to https://rideswith.com/api/strava/callback)
 */

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

// Required scopes for reading club events
const STRAVA_SCOPES = 'read,read_all';

interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: StravaAthlete;
}

export interface StravaClub {
  id: number;
  name: string;
  profile_medium: string;
  cover_photo: string;
  city: string;
  state: string;
  country: string;
  member_count: number;
  admin: boolean;
}

export interface StravaClubEvent {
  id: number;
  title: string;
  description: string;
  club_id: number;
  organizing_athlete: {
    firstname: string;
    lastname: string;
  };
  activity_type: string;
  created_at: string;
  route_id: number | null;
  upcoming_occurrences: string[]; // ISO date strings
  address: string;
  private: boolean;
  start_latlng?: [number, number]; // [latitude, longitude]
  start_date_local?: string;
  joined?: boolean;
  skill_level?: number; // 1-4
  terrain?: number; // 0-4
  women_only?: boolean;
}

/**
 * Get the Strava authorization URL for OAuth flow
 */
export function getStravaAuthorizationUrl(state: string): string {
  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    throw new Error('STRAVA_CLIENT_ID is not configured');
  }

  const redirectUri =
    process.env.STRAVA_REDIRECT_URI ||
    `${process.env.AUTH_URL || 'https://rideswith.com'}/api/strava/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: STRAVA_SCOPES,
    state,
    approval_prompt: 'auto',
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<StravaTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials not configured');
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Strava token exchange failed:', error);
    throw new Error('Failed to exchange code for tokens');
  }

  const data: StravaTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
  };
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<StravaTokens> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Strava credentials not configured');
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Strava token refresh failed:', error);
    throw new Error('Failed to refresh access token');
  }

  const data: StravaTokenResponse = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(data.expires_at * 1000),
  };
}

/**
 * Make an authenticated request to the Strava API
 */
export async function stravaApiFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${STRAVA_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Strava API error (${endpoint}):`, error);
    throw new Error(`Strava API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get list of clubs the authenticated user is a member of
 */
export async function getAthleteClubs(
  accessToken: string
): Promise<StravaClub[]> {
  return stravaApiFetch<StravaClub[]>('/athlete/clubs', accessToken);
}

/**
 * Get upcoming events for a club
 */
export async function getClubEvents(
  clubId: string,
  accessToken: string
): Promise<StravaClubEvent[]> {
  return stravaApiFetch<StravaClubEvent[]>(
    `/clubs/${clubId}/group_events`,
    accessToken
  );
}

/**
 * Get details of a specific club
 */
export async function getClub(
  clubId: string,
  accessToken: string
): Promise<StravaClub> {
  return stravaApiFetch<StravaClub>(`/clubs/${clubId}`, accessToken);
}

/**
 * Check if tokens are expired (with 5 minute buffer)
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return new Date().getTime() > expiresAt.getTime() - bufferMs;
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getValidAccessToken(connection: {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<{ accessToken: string; refreshed: boolean; newTokens?: StravaTokens }> {
  if (!isTokenExpired(connection.expiresAt)) {
    return { accessToken: connection.accessToken, refreshed: false };
  }

  const newTokens = await refreshAccessToken(connection.refreshToken);
  return {
    accessToken: newTokens.accessToken,
    refreshed: true,
    newTokens,
  };
}

/**
 * Generate a Strava event URL
 */
export function getStravaEventUrl(clubId: string, eventId: string | number): string {
  return `https://www.strava.com/clubs/${clubId}/group_events/${eventId}`;
}
