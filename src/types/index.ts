// Base types
export type UnitSystem = 'imperial' | 'metric';
export type PaceCategory = 'casual' | 'moderate' | 'fast' | 'race';
export type Difficulty = 'easy' | 'moderate' | 'hard';
export type Visibility = 'public' | 'private';
export type RsvpStatus = 'going' | 'maybe' | 'cant_go';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';

// User settings
export interface UserSettings {
  sessionId: string;
  email?: string;
  name?: string;
  preferredLocation?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  timezone: string;
  unitSystem: UnitSystem;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

// Organizer profile
export interface OrganizerProfile {
  id: string;
  profileName: string;
  brandfetchDomain?: string;
  isBrandOfficial: boolean;
  logoUrl?: string;
  brandColorPrimary?: string;
  brandColorSecondary?: string;
  website?: string;
  instagramHandle?: string;
  contactEmail?: string;
  bio?: string;
  verificationStatus: VerificationStatus;
  followerCount: number;
  createdAt: Date;
}

// Ride
export interface Ride {
  id: string;
  title: string;
  organizerProfile?: OrganizerProfile;
  organizerProfileId?: string;
  individualOrganizerName: string;
  individualOrganizerEmail: string;
  dateTimeUtc: Date;
  timezone: string;
  meetingLocation: string;
  locationLatitude: number;
  locationLongitude: number;
  distanceKm: number;
  paceKph: number;
  paceCategory: PaceCategory;
  difficulty: Difficulty;
  description?: string;
  gpxFileUrl?: string;
  routeUrlRwgps?: string;
  routeUrlKomoot?: string;
  addeventUrl?: string;
  qrCodeUrl?: string;
  visibility: Visibility;
  rsvpCount: number;
  photoCount: number;
  viewCount: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// RSVP
export interface Rsvp {
  id: string;
  rideId: string;
  name: string;
  email: string;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Photo
export interface Photo {
  id: string;
  rideId: string;
  uploaderEmail: string;
  uploaderName?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  caption?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Map types
export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  paceCategory: PaceCategory;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Route types
export interface RoutePoint {
  latitude: number;
  longitude: number;
  elevation?: number;
}

export interface RouteData {
  points: RoutePoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  bounds: MapBounds;
}
