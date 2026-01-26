import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addWeeks, addMonths, isBefore, startOfDay } from 'date-fns';
import { RecurrencePattern } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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
        chapter: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: {
              select: {
                name: true,
                slug: true,
                logo: true,
                logoIcon: true,
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
      paceMin: ride.paceMin,
      paceMax: ride.paceMax,
      terrain: ride.terrain,
      maxAttendees: ride.maxAttendees,
      isFree: ride.isFree,
      price: ride.price,
      routeUrl: ride.routeUrl,
      organizer: ride.organizer,
      brand: ride.chapter?.brand || null,
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
    const { title, date, locationName, locationAddress, latitude, longitude } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    if (!locationName || !locationAddress || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
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

    // Check for recurrence settings
    const isRecurring = body.recurrencePattern && body.recurrenceEndDate;
    const recurrencePattern = body.recurrencePattern as RecurrencePattern | null;
    const recurrenceEndDate = body.recurrenceEndDate ? new Date(body.recurrenceEndDate) : null;

    // Base ride data (shared across all instances if recurring)
    const baseRideData = {
      title: title.trim(),
      description: body.description || null,
      timezone: body.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      locationName,
      locationAddress,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      distance: body.distance ? parseFloat(body.distance) : null,
      elevation: body.elevation ? parseFloat(body.elevation) : null,
      paceMin: body.paceMin ? parseFloat(body.paceMin) : null,
      paceMax: body.paceMax ? parseFloat(body.paceMax) : null,
      terrain: body.terrain || null,
      maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
      routeUrl: body.routeUrl || null,
      isFree: body.isFree !== false,
      price: body.price ? parseFloat(body.price) : null,
      currency: body.currency || 'EUR',
      status: 'PUBLISHED' as const,
      organizerId: organizer.id,
      chapterId: body.chapterId || null,
    };

    // Create the first/template ride
    const firstRideDate = new Date(date);
    const ride = await prisma.ride.create({
      data: {
        ...baseRideData,
        date: firstRideDate,
        endTime: body.endTime ? new Date(body.endTime) : null,
        recurrencePattern: isRecurring ? recurrencePattern : null,
        recurrenceDay: isRecurring ? firstRideDate.getDay() : null,
        recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
        isRecurringTemplate: isRecurring || false,
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

    // If recurring, update the template with its own ID as seriesId and create future instances
    if (isRecurring && recurrencePattern && recurrenceEndDate) {
      // Update template ride with series ID
      await prisma.ride.update({
        where: { id: ride.id },
        data: { recurrenceSeriesId: ride.id },
      });

      // Generate future ride dates
      const futureDates: Date[] = [];
      let currentDate = firstRideDate;
      const endDate = startOfDay(recurrenceEndDate);

      // Calculate time difference between date and endTime for duration
      const rideDuration = body.endTime
        ? new Date(body.endTime).getTime() - firstRideDate.getTime()
        : null;

      while (true) {
        // Get next occurrence based on pattern
        if (recurrencePattern === 'WEEKLY') {
          currentDate = addWeeks(currentDate, 1);
        } else if (recurrencePattern === 'BIWEEKLY') {
          currentDate = addWeeks(currentDate, 2);
        } else if (recurrencePattern === 'MONTHLY') {
          currentDate = addMonths(currentDate, 1);
        }

        // Stop if we've passed the end date
        if (!isBefore(startOfDay(currentDate), endDate) &&
            startOfDay(currentDate).getTime() !== endDate.getTime()) {
          break;
        }

        futureDates.push(new Date(currentDate));
      }

      // Create all future ride instances
      if (futureDates.length > 0) {
        const futureRidesData = futureDates.map((rideDate) => ({
          ...baseRideData,
          date: rideDate,
          endTime: rideDuration ? new Date(rideDate.getTime() + rideDuration) : null,
          recurrencePattern,
          recurrenceDay: rideDate.getDay(),
          recurrenceEndDate,
          recurrenceSeriesId: ride.id,
          isRecurringTemplate: false,
        }));

        await prisma.ride.createMany({
          data: futureRidesData,
        });

        // Update organizer and chapter ride counts for all rides created
        const totalRides = futureDates.length; // +1 already counted for first ride below
        await prisma.organizer.update({
          where: { id: organizer.id },
          data: { rideCount: { increment: totalRides } },
        });

        if (body.chapterId) {
          await prisma.chapter.update({
            where: { id: body.chapterId },
            data: { rideCount: { increment: totalRides } },
          });
        }
      }
    }

    // Update organizer ride count
    await prisma.organizer.update({
      where: { id: organizer.id },
      data: { rideCount: { increment: 1 } },
    });

    // Update chapter ride count if this is a chapter ride
    if (body.chapterId) {
      await prisma.chapter.update({
        where: { id: body.chapterId },
        data: { rideCount: { increment: 1 } },
      });
    }

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
    // Return more details in development
    const errorMessage = error instanceof Error ? error.message : 'Failed to create ride';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
