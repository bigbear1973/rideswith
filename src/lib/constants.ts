export const PACE_CATEGORIES = {
  casual: { label: 'Casual', min: 0, max: 20, color: '#10b981' },
  moderate: { label: 'Moderate', min: 20, max: 26, color: '#3b82f6' },
  fast: { label: 'Fast', min: 26, max: 32, color: '#f59e0b' },
  race: { label: 'Race Pace', min: 32, max: 100, color: '#ef4444' },
} as const;

export const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', color: '#10b981' },
  moderate: { label: 'Moderate', color: '#f59e0b' },
  hard: { label: 'Hard', color: '#ef4444' },
} as const;

export const MAX_PHOTOS_PER_RIDE = 20;
export const MAX_PHOTO_SIZE_MB = 50;
export const MAX_DISTANCE_KM = 500;
export const MAX_PACE_KPH = 60;

export const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  name: 'San Francisco, CA',
};

export const DEFAULT_RADIUS_KM = 50;
export const DEFAULT_MAP_ZOOM = 11;

export const ROUTE_PLATFORMS = {
  strava: {
    name: 'Strava',
    icon: '/icons/strava.svg',
    fileFormat: 'gpx',
  },
  garmin: {
    name: 'Garmin Connect',
    icon: '/icons/garmin.svg',
    fileFormat: 'gpx',
  },
  wahoo: {
    name: 'Wahoo',
    icon: '/icons/wahoo.svg',
    fileFormat: 'gpx',
  },
  ridewithgps: {
    name: 'Ride with GPS',
    icon: '/icons/rwgps.svg',
    fileFormat: 'gpx',
    apiEnabled: true,
  },
  komoot: {
    name: 'Komoot',
    icon: '/icons/komoot.svg',
    fileFormat: 'gpx',
    apiEnabled: true,
  },
} as const;

export const SUPPORTED_GPX_EXTENSIONS = ['.gpx', '.tcx', '.fit'];
