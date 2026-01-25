import { z } from 'zod';
import { MAX_DISTANCE_KM, MAX_PACE_KPH } from './constants';

export const createRideSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  dateTimeUtc: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Ride date must be in the future',
  }),
  timezone: z.string().min(1, 'Timezone is required'),
  meetingLocation: z
    .string()
    .min(3, 'Meeting location must be at least 3 characters')
    .max(200, 'Meeting location must be less than 200 characters'),
  locationLatitude: z.coerce.number().min(-90).max(90),
  locationLongitude: z.coerce.number().min(-180).max(180),
  distanceKm: z.coerce
    .number()
    .min(1, 'Distance must be at least 1 km')
    .max(MAX_DISTANCE_KM, `Distance must be less than ${MAX_DISTANCE_KM} km`),
  paceKph: z.coerce
    .number()
    .min(10, 'Pace must be at least 10 kph')
    .max(MAX_PACE_KPH, `Pace must be less than ${MAX_PACE_KPH} kph`),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  organizerProfileId: z.string().uuid().optional(),
  individualOrganizerName: z.string().max(100).optional(),
  individualOrganizerEmail: z.string().email().optional(),
  routeUrlRwgps: z.string().url().optional().or(z.literal('')),
  routeUrlKomoot: z.string().url().optional().or(z.literal('')),
});

export const rsvpSchema = z.object({
  rideId: z.string().uuid(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  status: z.enum(['going', 'maybe', 'cant_go']),
});

export const organizerProfileSchema = z.object({
  profileName: z
    .string()
    .min(2, 'Profile name must be at least 2 characters')
    .max(100, 'Profile name must be less than 100 characters'),
  brandfetchDomain: z.string().url().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  instagramHandle: z
    .string()
    .regex(/^@?[a-zA-Z0-9._]+$/, 'Invalid Instagram handle')
    .optional()
    .or(z.literal('')),
  contactEmail: z.string().email().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

export const filterSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(500).optional(),
  paceCategories: z.array(z.enum(['casual', 'moderate', 'fast', 'race'])).optional(),
  difficulties: z.array(z.enum(['easy', 'moderate', 'hard'])).optional(),
  minDistanceKm: z.coerce.number().min(0).optional(),
  maxDistanceKm: z.coerce.number().max(MAX_DISTANCE_KM).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  organizerId: z.string().uuid().optional(),
  searchQuery: z.string().max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type OrganizerProfileInput = z.infer<typeof organizerProfileSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
