import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const rsvpLimiter = rateLimit({ interval: 60000, limit: 30 });

// GET /api/rsvps?rideId=xxx - Get RSVPs for a ride
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required' }, { status: 400 });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        organizer: {
          select: {
            members: {
              where: {
                userId: session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    const canSeeEmail = ride.organizer.members.length > 0;

    const rsvps = await prisma.rsvp.findMany({
      where: { rideId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (canSeeEmail) {
      return NextResponse.json(rsvps);
    }

    return NextResponse.json(
      rsvps.map((rsvp) => ({
        ...rsvp,
        user: {
          id: rsvp.user.id,
          name: rsvp.user.name,
          image: rsvp.user.image,
          slug: rsvp.user.slug,
        },
      }))
    );
  } catch (error) {
    console.error('GET /api/rsvps error:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}

// POST /api/rsvps - Create or update RSVP
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await rsvpLimiter.check(session.user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { rideId, status } = body;

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['GOING', 'MAYBE', 'NOT_GOING'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Check if ride exists and is published
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        status: true,
        maxAttendees: true,
        chapterId: true,
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

    if (ride.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Cannot RSVP to unpublished ride' }, { status: 400 });
    }

    // Check capacity if setting to GOING
    if (status === 'GOING' && ride.maxAttendees) {
      const existingRsvp = await prisma.rsvp.findUnique({
        where: {
          rideId_userId: {
            rideId,
            userId: session.user.id,
          },
        },
      });

      // Only check capacity if user isn't already GOING
      if (!existingRsvp || existingRsvp.status !== 'GOING') {
        if (ride._count.rsvps >= ride.maxAttendees) {
          return NextResponse.json({ error: 'Ride is at capacity' }, { status: 400 });
        }
      }
    }

    // Upsert RSVP
    const rsvp = await prisma.rsvp.upsert({
      where: {
        rideId_userId: {
          rideId,
          userId: session.user.id,
        },
      },
      update: { status },
      create: {
        rideId,
        userId: session.user.id,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            slug: true,
          },
        },
      },
    });

    // Auto-follow chapter when RSVPing (if enabled in user settings)
    if ((status === 'GOING' || status === 'MAYBE') && ride.chapterId) {
      // Check user's notification settings
      const settings = await prisma.userNotificationSettings.findUnique({
        where: { userId: session.user.id },
      });

      // Auto-follow is enabled by default (if no settings exist, or if autoFollowOnRsvp is true)
      if (!settings || settings.autoFollowOnRsvp) {
        // Create follow if not already following (upsert to handle race conditions)
        await prisma.follow.upsert({
          where: {
            userId_chapterId: {
              userId: session.user.id,
              chapterId: ride.chapterId,
            },
          },
          update: {},
          create: {
            userId: session.user.id,
            chapterId: ride.chapterId,
          },
        }).catch(() => {
          // Ignore errors (e.g., if constraint fails)
        });
      }
    }

    return NextResponse.json(rsvp);
  } catch (error) {
    console.error('POST /api/rsvps error:', error);
    return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 });
  }
}

// DELETE /api/rsvps - Remove RSVP
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required' }, { status: 400 });
    }

    await prisma.rsvp.delete({
      where: {
        rideId_userId: {
          rideId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rsvps error:', error);
    return NextResponse.json({ error: 'Failed to remove RSVP' }, { status: 500 });
  }
}
