import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const ride = await prisma.ride.findUnique({
      where: { id },
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
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: ride.id,
      title: ride.title,
      description: ride.description,
      date: ride.date,
      endTime: ride.endTime,
      timezone: ride.timezone,
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
      attendeeCount: ride._count.rsvps,
      // Recurrence fields
      recurrencePattern: ride.recurrencePattern,
      recurrenceSeriesId: ride.recurrenceSeriesId,
      recurrenceEndDate: ride.recurrenceEndDate,
      isRecurringTemplate: ride.isRecurringTemplate,
      // Live location fields
      isLive: ride.isLive,
      liveLocationUrl: ride.liveLocationUrl,
      liveStartedAt: ride.liveStartedAt,
    });
  } catch (error) {
    console.error('GET /api/rides/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch ride' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();

    // Find the ride and check ownership
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Check if user has permission to edit
    if (ride.organizer.members.length === 0) {
      return NextResponse.json({ error: 'You do not have permission to edit this ride' }, { status: 403 });
    }

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

    // Update the ride
    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        title: title.trim(),
        description: body.description || null,
        date: new Date(date),
        endTime: body.endTime ? new Date(body.endTime) : null,
        timezone: body.timezone || ride.timezone,
        locationName,
        locationAddress,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distance: body.distance ? parseFloat(body.distance) : null,
        elevation: body.elevation ? parseFloat(body.elevation) : null,
        paceMin: body.paceMin !== undefined ? parseFloat(body.paceMin) : null,
        paceMax: body.paceMax !== undefined ? parseFloat(body.paceMax) : null,
        terrain: body.terrain || null,
        maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
        routeUrl: body.routeUrl || null,
        isFree: body.isFree !== false,
        price: body.price ? parseFloat(body.price) : null,
        // Live location fields
        isLive: body.isLive === true,
        liveLocationUrl: body.liveLocationUrl || null,
        liveStartedAt: body.isLive === true && !ride.isLive ? new Date() : (body.isLive === false ? null : ride.liveStartedAt),
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

    return NextResponse.json(updatedRide);
  } catch (error) {
    console.error('PUT /api/rides/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update ride' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Get scope from query params: 'this' (default), 'following', or 'all'
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'this';

    // Find the ride and check ownership
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: {
        organizer: {
          include: {
            members: {
              where: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Check if user has permission to delete
    if (ride.organizer.members.length === 0) {
      return NextResponse.json({ error: 'You do not have permission to delete this ride' }, { status: 403 });
    }

    let deletedCount = 1;

    // Handle recurring ride deletion based on scope
    if (ride.recurrenceSeriesId && scope !== 'this') {
      if (scope === 'all') {
        // Delete all rides in the series
        const result = await prisma.ride.deleteMany({
          where: { recurrenceSeriesId: ride.recurrenceSeriesId },
        });
        deletedCount = result.count;
      } else if (scope === 'following') {
        // Delete this ride and all future rides in the series
        const result = await prisma.ride.deleteMany({
          where: {
            recurrenceSeriesId: ride.recurrenceSeriesId,
            date: { gte: ride.date },
          },
        });
        deletedCount = result.count;
      }
    } else {
      // Delete just this ride
      await prisma.ride.delete({
        where: { id },
      });
    }

    // Update organizer ride count
    await prisma.organizer.update({
      where: { id: ride.organizerId },
      data: { rideCount: { decrement: deletedCount } },
    });

    // Also update chapter ride count if applicable
    if (ride.chapterId) {
      await prisma.chapter.update({
        where: { id: ride.chapterId },
        data: { rideCount: { decrement: deletedCount } },
      });
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('DELETE /api/rides/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete ride' }, { status: 500 });
  }
}
