import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rideId = searchParams.get('rideId');
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24', 10), 1), 100);
    const skip = (page - 1) * limit;

    if (!rideId) {
      return NextResponse.json({ error: 'rideId is required' }, { status: 400 });
    }

    const [total, photos] = await Promise.all([
      prisma.ridePhoto.count({ where: { rideId } }),
      prisma.ridePhoto.findMany({
        where: { rideId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/photos error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rideId, publicId, url, thumbnailUrl, width, height, isVideo, caption } = body;

    if (!rideId || !publicId || !url) {
      return NextResponse.json({ error: 'rideId, publicId, and url are required' }, { status: 400 });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true, status: true },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    if (ride.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Cannot add photos to unpublished ride' }, { status: 400 });
    }

    const photo = await prisma.ridePhoto.create({
      data: {
        rideId,
        userId: session.user.id,
        publicId,
        url,
        thumbnailUrl: thumbnailUrl || null,
        width: width ? parseInt(width, 10) : null,
        height: height ? parseInt(height, 10) : null,
        isVideo: !!isVideo,
        caption: caption || null,
      },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('POST /api/photos error:', error);
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
