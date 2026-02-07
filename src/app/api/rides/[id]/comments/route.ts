import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const commentLimiter = rateLimit({ interval: 60000, limit: 20 });

// GET /api/rides/[id]/comments - List all comments for a ride
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rideId } = await params;

    // Fetch top-level comments (no parentId) with their replies
    const comments = await prisma.rideComment.findMany({
      where: {
        rideId,
        parentId: null, // Only top-level comments
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
        replies: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform response
    const transformUser = (user: { id: string; name: string | null; email: string | null; image: string | null; slug: string | null }) => ({
      id: user.id,
      name: user.name || user.email?.split('@')[0] || 'Anonymous',
      image: user.image,
      slug: user.slug,
    });

    const response = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
      user: transformUser(comment.user),
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        parentId: reply.parentId,
        user: transformUser(reply.user),
      })),
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

    const { success } = await commentLimiter.check(session.user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { id: rideId } = await params;
    const { content, parentId } = await request.json();

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

    // If parentId provided, verify parent comment exists and belongs to this ride
    if (parentId) {
      const parentComment = await prisma.rideComment.findUnique({
        where: { id: parentId },
        select: { id: true, rideId: true },
      });

      if (!parentComment || parentComment.rideId !== rideId) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    // Create comment
    const comment = await prisma.rideComment.create({
      data: {
        rideId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
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
      parentId: comment.parentId,
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
