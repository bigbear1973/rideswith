import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RidePace } from '@prisma/client';

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
      terrain: ride.terrain,
      maxAttendees: ride.maxAttendees,
      isFree: ride.isFree,
      price: ride.price,
      routeUrl: ride.routeUrl,
      organizer: ride.organizer,
      attendeeCount: ride._count.rsvps,
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
        pace: pace as RidePace,
        terrain: body.terrain || null,
        maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
        routeUrl: body.routeUrl || null,
        isFree: body.isFree !== false,
        price: body.price ? parseFloat(body.price) : null,
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

    // Delete the ride
    await prisma.ride.delete({
      where: { id },
    });

    // Update organizer ride count
    await prisma.organizer.update({
      where: { id: ride.organizerId },
      data: { rideCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rides/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete ride' }, { status: 500 });
  }
}
