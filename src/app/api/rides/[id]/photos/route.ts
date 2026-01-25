import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteImage, getThumbnailUrl } from '@/lib/cloudinary';

// GET /api/rides/[id]/photos - List all photos for a ride
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rideId } = await params;

    const photos = await prisma.ridePhoto.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    // Transform response
    const response = photos.map((photo) => ({
      id: photo.id,
      publicId: photo.publicId,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl || getThumbnailUrl(photo.publicId),
      width: photo.width,
      height: photo.height,
      caption: photo.caption,
      createdAt: photo.createdAt,
      user: {
        id: photo.user.id,
        name: photo.user.name || photo.user.email?.split('@')[0] || 'Anonymous',
        image: photo.user.image,
        slug: photo.user.slug,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/rides/[id]/photos error:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST /api/rides/[id]/photos - Save a photo after client-side upload to Cloudinary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rideId } = await params;
    const { publicId, url, width, height, caption } = await request.json();

    if (!publicId || !url) {
      return NextResponse.json({ error: 'publicId and url are required' }, { status: 400 });
    }

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Generate thumbnail URL
    const thumbnailUrl = getThumbnailUrl(publicId);

    // Create photo record
    const photo = await prisma.ridePhoto.create({
      data: {
        rideId,
        userId: session.user.id,
        publicId,
        url,
        thumbnailUrl,
        width: width || null,
        height: height || null,
        caption: caption?.trim() || null,
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

    return NextResponse.json({
      id: photo.id,
      publicId: photo.publicId,
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      width: photo.width,
      height: photo.height,
      caption: photo.caption,
      createdAt: photo.createdAt,
      user: {
        id: photo.user.id,
        name: photo.user.name || photo.user.email?.split('@')[0] || 'Anonymous',
        image: photo.user.image,
        slug: photo.user.slug,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/rides/[id]/photos error:', error);
    return NextResponse.json({ error: 'Failed to save photo' }, { status: 500 });
  }
}

// DELETE /api/rides/[id]/photos - Delete a photo (via query param ?photoId=xxx)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rideId } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    // Find photo
    const photo = await prisma.ridePhoto.findUnique({
      where: { id: photoId },
      include: {
        ride: {
          include: {
            organizer: {
              include: {
                members: {
                  where: {
                    userId: session.user.id,
                    role: { in: ['OWNER', 'ADMIN'] },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!photo || photo.rideId !== rideId) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Check permission: user owns photo OR is ride organizer
    const isOwner = photo.userId === session.user.id;
    const isOrganizer = photo.ride.organizer.members.length > 0;

    if (!isOwner && !isOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Cloudinary
    try {
      await deleteImage(photo.publicId);
    } catch (cloudinaryError) {
      console.error('Failed to delete from Cloudinary:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await prisma.ridePhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rides/[id]/photos error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
