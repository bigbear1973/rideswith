import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/rides/[id]/comments - List all comments for a ride
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rideId } = await params;

    const comments = await prisma.rideComment.findMany({
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
    const response = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        name: comment.user.name || comment.user.email?.split('@')[0] || 'Anonymous',
        image: comment.user.image,
        slug: comment.user.slug,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/rides/[id]/comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/rides/[id]/comments - Add a comment to a ride
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
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Comment is too long (max 2000 characters)' }, { status: 400 });
    }

    // Check if ride exists
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true, date: true },
    });

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.rideComment.create({
      data: {
        rideId,
        userId: session.user.id,
        content: content.trim(),
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
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: {
        id: comment.user.id,
        name: comment.user.name || comment.user.email?.split('@')[0] || 'Anonymous',
        image: comment.user.image,
        slug: comment.user.slug,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/rides/[id]/comments error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// DELETE /api/rides/[id]/comments - Delete a comment (via query param ?commentId=xxx)
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
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Find comment
    const comment = await prisma.rideComment.findUnique({
      where: { id: commentId },
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

    if (!comment || comment.rideId !== rideId) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check permission: user owns comment OR is ride organizer
    const isOwner = comment.userId === session.user.id;
    const isOrganizer = comment.ride.organizer.members.length > 0;

    if (!isOwner && !isOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete comment
    await prisma.rideComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/rides/[id]/comments error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
