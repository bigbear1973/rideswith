import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Detect platform from URL
function detectPlatform(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('komoot.com')) return 'Komoot';
  if (lower.includes('ridewithgps.com')) return 'RideWithGPS';
  if (lower.includes('strava.com')) return 'Strava';
  if (lower.includes('garmin.com') || lower.includes('connect.garmin')) return 'Garmin';
  if (lower.includes('wahoo')) return 'Wahoo';
  if (lower.includes('mapmyride')) return 'MapMyRide';
  return 'Other';
}

// GET /api/rides/[id]/routes - List all route links for a ride
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const routes = await prisma.rideRoute.findMany({
      where: { rideId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(routes);
  } catch (error) {
    console.error('GET /api/rides/[id]/routes error:', error);
    return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
  }
}

// POST /api/rides/[id]/routes - Add a route link
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Check ride exists
    const ride = await prisma.ride.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Detect platform from URL
    const platform = detectPlatform(url);

    // Check if this platform already has a route for this ride
    const existing = await prisma.rideRoute.findUnique({
      where: {
        rideId_platform: {
          rideId: id,
          platform,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `A ${platform} route has already been added to this ride` },
        { status: 409 }
      );
    }

    // Create the route link
    const route = await prisma.rideRoute.create({
      data: {
        rideId: id,
        userId: session.user.id,
        platform,
        url: url.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('POST /api/rides/[id]/routes error:', error);
    return NextResponse.json({ error: 'Failed to add route' }, { status: 500 });
  }
}

// DELETE /api/rides/[id]/routes - Delete a route link (only by the user who added it)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json({ error: 'routeId is required' }, { status: 400 });
    }

    // Find the route and check ownership
    const route = await prisma.rideRoute.findUnique({
      where: { id: routeId },
      select: { userId: true, rideId: true },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (route.rideId !== id) {
      return NextResponse.json({ error: 'Route does not belong to this ride' }, { status: 400 });
    }

    // Only the user who added it can delete it
    if (route.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this route' }, { status: 403 });
    }

    await prisma.rideRoute.delete({
      where: { id: routeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rides/[id]/routes error:', error);
    return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
  }
}
