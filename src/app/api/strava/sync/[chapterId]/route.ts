import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/roles';
import { syncStravaEvents, getStravaSyncStatus } from '@/lib/strava-sync';

interface RouteParams {
  params: Promise<{ chapterId: string }>;
}

/**
 * GET /api/strava/sync/[chapterId]
 *
 * Get the sync status for a chapter's Strava connection.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = await params;

    // Verify user is admin of chapter
    const membership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId,
          userId: session.user.id,
        },
      },
    });

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
        { error: 'Only chapter admins can view Strava sync status' },
        { status: 403 }
      );
    }

    const status = await getStravaSyncStatus(chapterId);

    if (!status) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('GET /api/strava/sync/[chapterId] error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/strava/sync/[chapterId]
 *
 * Trigger a manual sync of Strava events.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = await params;

    // Verify user is admin of chapter
    const membership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId,
          userId: session.user.id,
        },
      },
    });

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
        { error: 'Only chapter admins can sync Strava' },
        { status: 403 }
      );
    }

    // Check if connection exists and has a club selected
    const connection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No Strava connection found. Please connect Strava first.' },
        { status: 404 }
      );
    }

    if (!connection.stravaClubId) {
      return NextResponse.json(
        { error: 'No Strava club selected. Please select a club first.' },
        { status: 400 }
      );
    }

    // Run the sync
    const result = await syncStravaEvents(chapterId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/strava/sync/[chapterId] error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Strava events' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/strava/sync/[chapterId]
 *
 * Update sync settings (e.g., auto-sync toggle).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chapterId } = await params;
    const body = await request.json();

    // Verify user is admin of chapter
    const membership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId,
          userId: session.user.id,
        },
      },
    });

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
        { error: 'Only chapter admins can update Strava settings' },
        { status: 403 }
      );
    }

    // Update settings
    const updateData: { autoSync?: boolean } = {};

    if (typeof body.autoSync === 'boolean') {
      updateData.autoSync = body.autoSync;
    }

    const connection = await prisma.stravaConnection.update({
      where: { chapterId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      autoSync: connection.autoSync,
    });
  } catch (error) {
    console.error('PUT /api/strava/sync/[chapterId] error:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings' },
      { status: 500 }
    );
  }
}
