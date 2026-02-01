/**
 * Strava Club Event Sync Logic
 *
 * Syncs events from a Strava club to RidesWith rides.
 */

import { prisma } from './prisma';
import {
  getClubEvents,
  getValidAccessToken,
  getStravaEventUrl,
  type StravaClubEvent,
} from './strava';
import crypto from 'crypto';

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Generate a hash of event data to detect changes
 */
function hashEventData(event: StravaClubEvent): string {
  const dataToHash = {
    title: event.title,
    description: event.description,
    address: event.address,
    start_latlng: event.start_latlng,
    upcoming_occurrences: event.upcoming_occurrences,
  };
  return crypto
    .createHash('md5')
    .update(JSON.stringify(dataToHash))
    .digest('hex');
}

/**
 * Map a Strava event to RidesWith ride data
 */
function mapStravaEventToRide(
  event: StravaClubEvent,
  chapterId: string,
  organizerId: string,
  stravaClubId: string
) {
  // Get the event date - try upcoming_occurrences first, then start_date_local
  let eventDate: Date | null = null;
  const now = new Date();

  // Check upcoming_occurrences for a future date
  if (event.upcoming_occurrences && event.upcoming_occurrences.length > 0) {
    for (const occurrence of event.upcoming_occurrences) {
      const date = new Date(occurrence);
      if (date > now) {
        eventDate = date;
        break;
      }
    }
  }

  // Fall back to start_date_local if no future occurrence found
  if (!eventDate && event.start_date_local) {
    const date = new Date(event.start_date_local);
    if (date > now) {
      eventDate = date;
    }
  }

  // Skip events with no valid future date
  if (!eventDate) {
    console.log(`Skipping event "${event.title}" - no future date found`);
    return null;
  }

  // Parse location - Strava provides start_latlng as [lat, lng]
  const latitude = event.start_latlng?.[0] || 0;
  const longitude = event.start_latlng?.[1] || 0;

  // Map Strava skill level to pace (1=casual, 2=moderate, 3=fast, 4=race)
  let paceMin: number | null = null;
  let paceMax: number | null = null;
  if (event.skill_level) {
    // Rough mapping of skill levels to speeds
    const paceMap: Record<number, { min: number; max: number }> = {
      1: { min: 15, max: 22 }, // Casual
      2: { min: 22, max: 28 }, // Moderate
      3: { min: 28, max: 35 }, // Fast
      4: { min: 35, max: 45 }, // Race
    };
    const pace = paceMap[event.skill_level];
    if (pace) {
      paceMin = pace.min;
      paceMax = pace.max;
    }
  }

  return {
    title: event.title,
    description: event.description || null,
    date: eventDate,
    timezone: 'UTC',
    locationName: event.address || 'See Strava event for details',
    locationAddress: event.address || '',
    latitude,
    longitude,
    paceMin,
    paceMax,
    status: 'PUBLISHED' as const,
    organizerId,
    chapterId,
    stravaEventUrl: getStravaEventUrl(stravaClubId, event.id),
  };
}

/**
 * Sync events from a Strava club to a chapter
 */
export async function syncStravaEvents(chapterId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get the Strava connection for this chapter
    const connection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
      include: {
        chapter: {
          include: {
            brand: {
              select: { createdById: true },
            },
          },
        },
        user: {
          select: { id: true },
        },
      },
    });

    if (!connection) {
      result.errors.push('No Strava connection found for this chapter');
      return result;
    }

    // Get a valid access token (refresh if needed)
    const { accessToken, refreshed, newTokens } = await getValidAccessToken({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      expiresAt: connection.expiresAt,
    });

    // Update tokens if they were refreshed
    if (refreshed && newTokens) {
      await prisma.stravaConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
        },
      });
    }

    // Fetch events from Strava
    const events = await getClubEvents(connection.stravaClubId, accessToken);

    // Log raw event data for debugging
    console.log(`[Strava Sync] Fetched ${events.length} events from club ${connection.stravaClubId}`);
    for (const event of events) {
      console.log(`[Strava Sync] Event: "${event.title}" (ID: ${event.id})`);
      console.log(`  - upcoming_occurrences: ${JSON.stringify(event.upcoming_occurrences)}`);
      console.log(`  - start_date_local: ${event.start_date_local}`);
      console.log(`  - created_at: ${event.created_at}`);
    }

    // Find or create an organizer for the user who connected Strava
    let organizer = await prisma.organizer.findFirst({
      where: {
        members: {
          some: {
            userId: connection.userId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    });

    if (!organizer) {
      const user = await prisma.user.findUnique({
        where: { id: connection.userId },
        select: { name: true, email: true },
      });

      const organizerName =
        user?.name || user?.email?.split('@')[0] || 'Strava Sync';
      const baseSlug = organizerName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      organizer = await prisma.organizer.create({
        data: {
          name: organizerName,
          slug: uniqueSlug,
          members: {
            create: {
              userId: connection.userId,
              role: 'OWNER',
            },
          },
        },
      });
    }

    // Get existing synced events for this chapter
    const existingSynced = await prisma.stravaSyncedEvent.findMany({
      where: { chapterId },
    });
    const syncedByEventId = new Map(
      existingSynced.map((s) => [s.stravaEventId, s])
    );

    // Process each event
    for (const event of events) {
      const stravaEventId = String(event.id);

      // Skip private events
      if (event.private) {
        result.skipped++;
        continue;
      }

      // Check if already synced
      const existingSync = syncedByEventId.get(stravaEventId);
      const eventHash = hashEventData(event);

      if (existingSync) {
        // Check if event data has changed
        if (existingSync.stravaEventHash === eventHash) {
          result.skipped++;
          continue;
        }

        // Update existing ride
        const rideData = mapStravaEventToRide(
          event,
          chapterId,
          organizer.id,
          connection.stravaClubId
        );

        if (!rideData) {
          result.skipped++;
          continue;
        }

        try {
          await prisma.ride.update({
            where: { id: existingSync.rideId },
            data: {
              title: rideData.title,
              description: rideData.description,
              date: rideData.date,
              locationName: rideData.locationName,
              locationAddress: rideData.locationAddress,
              latitude: rideData.latitude,
              longitude: rideData.longitude,
              paceMin: rideData.paceMin,
              paceMax: rideData.paceMax,
              stravaEventUrl: rideData.stravaEventUrl,
            },
          });

          // Update sync record hash
          await prisma.stravaSyncedEvent.update({
            where: { id: existingSync.id },
            data: {
              stravaEventHash: eventHash,
              syncedAt: new Date(),
            },
          });

          result.updated++;
        } catch (err) {
          console.error(`Failed to update ride for Strava event ${stravaEventId}:`, err);
          result.errors.push(`Failed to update event ${event.title}`);
        }
      } else {
        // Create new ride
        const rideData = mapStravaEventToRide(
          event,
          chapterId,
          organizer.id,
          connection.stravaClubId
        );

        if (!rideData) {
          result.skipped++;
          continue;
        }

        try {
          const ride = await prisma.ride.create({
            data: rideData,
          });

          // Create sync record
          await prisma.stravaSyncedEvent.create({
            data: {
              chapterId,
              rideId: ride.id,
              stravaEventId,
              stravaEventHash: eventHash,
            },
          });

          // Update chapter ride count
          await prisma.chapter.update({
            where: { id: chapterId },
            data: { rideCount: { increment: 1 } },
          });

          // Update organizer ride count
          await prisma.organizer.update({
            where: { id: organizer.id },
            data: { rideCount: { increment: 1 } },
          });

          result.created++;
        } catch (err) {
          console.error(`Failed to create ride for Strava event ${stravaEventId}:`, err);
          result.errors.push(`Failed to create event ${event.title}`);
        }
      }
    }

    // Update last sync timestamp
    await prisma.stravaConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncError: result.errors.length > 0 ? result.errors.join('; ') : null,
      },
    });

    result.success = result.errors.length === 0;
    return result;
  } catch (err) {
    console.error('Strava sync failed:', err);
    result.errors.push(err instanceof Error ? err.message : 'Sync failed');

    // Try to update error status
    try {
      await prisma.stravaConnection.update({
        where: { chapterId },
        data: {
          lastSyncAt: new Date(),
          lastSyncError: result.errors.join('; '),
        },
      });
    } catch {
      // Ignore update errors
    }

    return result;
  }
}

/**
 * Get sync status for a chapter
 */
export async function getStravaSyncStatus(chapterId: string) {
  const connection = await prisma.stravaConnection.findUnique({
    where: { chapterId },
    select: {
      stravaClubId: true,
      stravaClubName: true,
      autoSync: true,
      lastSyncAt: true,
      lastSyncError: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!connection) {
    return null;
  }

  // Count synced rides
  const syncedCount = await prisma.stravaSyncedEvent.count({
    where: { chapterId },
  });

  return {
    connected: true,
    clubId: connection.stravaClubId,
    clubName: connection.stravaClubName,
    autoSync: connection.autoSync,
    lastSyncAt: connection.lastSyncAt,
    lastSyncError: connection.lastSyncError,
    syncedRideCount: syncedCount,
    connectedBy: connection.user.name || connection.user.email,
  };
}
