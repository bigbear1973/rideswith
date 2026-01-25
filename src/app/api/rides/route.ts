import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RidePace } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pace = searchParams.get('pace');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius'); // in km

    // Build filter conditions
    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      date: {
        gte: new Date(), // Only future rides
      },
    };

    if (pace && ['CASUAL', 'MODERATE', 'FAST', 'RACE'].includes(pace.toUpperCase())) {
      where.pace = pace.toUpperCase() as RidePace;
    }

    const rides = await prisma.ride.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            slug: true,
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
      orderBy: {
        date: 'asc',
      },
      take: 50,
    });

    // If location provided, filter by distance (simple bounding box for now)
    let filteredRides = rides;
    if (lat && lng && radius) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      // Haversine distance calculation
      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      filteredRides = rides.filter((ride) => {
        const distance = haversine(centerLat, centerLng, ride.latitude, ride.longitude);
        return distance <= radiusKm;
      });
    }

    // Transform response
    const response = filteredRides.map((ride) => ({
      id: ride.id,
      title: ride.title,
      description: ride.description,
      date: ride.date,
      endTime: ride.endTime,
      locationName: ride.locationName,
      locationAddress: ride.locationAddress,
      latitude: ride.latitude,
      longitude: ride.longitude,
      distance: ride.distance,
      elevation: ride.elevation,
      pace: ride.pace.toLowerCase(),
      terrain: ride.terrain,
      maxAttendees: ride.maxAttendees,
      isFree: ride.isFree,
      price: ride.price,
      routeUrl: ride.routeUrl,
      organizer: ride.organizer,
      attendeeCount: ride._count.rsvps,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/rides error:', error);
    return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate required fields
    const { title, date, locationName, locationAddress, latitude, longitude, pace } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    if (!locationName || !locationAddress || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    if (!pace || !['CASUAL', 'MODERATE', 'FAST', 'RACE'].includes(pace)) {
      return NextResponse.json({ error: 'Valid pace is required' }, { status: 400 });
    }

    // Find or create organizer for the user
    let organizer = await prisma.organizer.findFirst({
      where: {
        members: {
          some: {
            userId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
        },
      },
    });

    if (!organizer) {
      // Create a personal organizer for the user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      const organizerName = user?.name || user?.email?.split('@')[0] || 'My Rides';
      const baseSlug = organizerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      organizer = await prisma.organizer.create({
        data: {
          name: organizerName,
          slug: uniqueSlug,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });
    }

    // Create the ride
    const ride = await prisma.ride.create({
      data: {
        title: title.trim(),
        description: body.description || null,
        date: new Date(date),
        endTime: body.endTime ? new Date(body.endTime) : null,
        timezone: body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        locationName,
        locationAddress,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distance: body.distance ? parseFloat(body.distance) : null,
        elevation: body.elevation ? parseFloat(body.elevation) : null,
        pace: pace as RidePace,
        terrain: body.terrain || null,
        maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
        routeUrl: body.routeUrl || null,
        isFree: body.isFree !== false,
        price: body.price ? parseFloat(body.price) : null,
        currency: body.currency || 'EUR',
        status: 'PUBLISHED',
        organizerId: organizer.id,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Update organizer ride count
    await prisma.organizer.update({
      where: { id: organizer.id },
      data: { rideCount: { increment: 1 } },
    });

    // Auto-RSVP the creator as going
    await prisma.rsvp.create({
      data: {
        rideId: ride.id,
        userId,
        status: 'GOING',
      },
    });

    return NextResponse.json(ride, { status: 201 });
  } catch (error) {
    console.error('POST /api/rides error:', error);
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 });
  }
}
