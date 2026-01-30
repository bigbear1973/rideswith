import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    const now = new Date();

    // Base where clause
    const baseWhere = {
      status: 'PUBLISHED' as const,
      date: {
        gte: now, // Only future rides
      },
      // For recurring rides, only show the template (first ride in series)
      OR: [
        { recurrenceSeriesId: null }, // Not part of a recurring series
        { isRecurringTemplate: true }, // Is the template ride
      ],
    };

    // Build filter-specific where clause
    let whereClause: typeof baseWhere & { date?: { gte: Date; lte?: Date }; chapterId?: { not: null } } = { ...baseWhere };

    // This Week filter - rides in the next 7 days
    if (filter === 'week') {
      whereClause = {
        ...baseWhere,
        date: {
          gte: startOfDay(now),
          lte: endOfDay(addDays(now, 7)),
        },
      };
    }

    // Club Rides filter - only rides associated with a chapter/community
    if (filter === 'club') {
      whereClause = {
        ...baseWhere,
        chapterId: { not: null },
      };
    }

    // Fetch rides
    let rides = await prisma.ride.findMany({
      where: whereClause,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
            brand: {
              select: {
                name: true,
                logo: true,
                backdrop: true,
                primaryColor: true,
              },
            },
          },
        },
        _count: {
          select: {
            rsvps: {
              where: { status: 'GOING' },
            },
          },
        },
      },
      orderBy: filter === 'week'
        ? { date: 'asc' } // For "This Week", order by date
        : { createdAt: 'desc' }, // Most recently added for others
      take: filter === 'near' ? 100 : limit, // Get more for near me to filter by distance
    });

    // Near Me filter - filter by distance if lat/lng provided
    if (filter === 'near' && lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxDistanceKm = 50; // 50km radius

      // Calculate distance using Haversine formula
      rides = rides
        .map((ride) => {
          const distance = haversineDistance(userLat, userLng, ride.latitude, ride.longitude);
          return { ...ride, distanceFromUser: distance };
        })
        .filter((ride) => ride.distanceFromUser <= maxDistanceKm)
        .sort((a, b) => a.distanceFromUser - b.distanceFromUser)
        .slice(0, limit);
    }

    const response = rides.map((ride) => ({
      id: ride.id,
      title: ride.title,
      date: ride.date,
      locationName: ride.locationName,
      latitude: ride.latitude,
      longitude: ride.longitude,
      distance: ride.distance,
      pace: ride.pace.toLowerCase(),
      organizer: ride.organizer,
      attendeeCount: ride._count.rsvps,
      // Include brand info if this is a branded ride
      brand: ride.chapter?.brand ? {
        name: ride.chapter.brand.name,
        logo: ride.chapter.brand.logo,
        backdrop: ride.chapter.brand.backdrop,
        primaryColor: ride.chapter.brand.primaryColor,
      } : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/rides/latest error:', error);
    return NextResponse.json({ error: 'Failed to fetch latest rides' }, { status: 500 });
  }
}

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
