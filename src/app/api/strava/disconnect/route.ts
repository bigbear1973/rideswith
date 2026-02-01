import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/roles';

/**
 * DELETE /api/strava/disconnect
 *
 * Disconnect Strava from a chapter.
 *
 * Query params:
 *   - chapterId: The chapter to disconnect
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');

    if (!chapterId) {
      return NextResponse.json(
        { error: 'chapterId is required' },
        { status: 400 }
      );
    }

    // Check if user is admin of this chapter
    const membership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId,
          userId: session.user.id,
        },
      },
    });

    // Also check if user is brand owner
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        brand: { select: { createdById: true } },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const isBrandOwner = chapter.brand.createdById === session.user.id;
    const isChapterAdmin = membership && isAdmin(membership.role);

    if (!isBrandOwner && !isChapterAdmin) {
      return NextResponse.json(
        { error: 'Only chapter admins can disconnect Strava' },
        { status: 403 }
      );
    }

    // Check if connection exists
    const connection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No Strava connection found' },
        { status: 404 }
      );
    }

    // Delete the connection (synced events remain linked to rides)
    await prisma.stravaConnection.delete({
      where: { chapterId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/strava/disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Strava' },
      { status: 500 }
    );
  }
}
