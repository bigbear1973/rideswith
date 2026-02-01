import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidAccessToken, stravaApiFetch } from '@/lib/strava';
import { isAdmin } from '@/lib/roles';

/**
 * GET /api/strava/debug?chapterId=xxx
 *
 * Debug endpoint to see raw Strava event data.
 * Only accessible by chapter admins.
 */
export async function GET(request: NextRequest) {
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

    // Verify user is admin
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get connection
    const connection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No Strava connection' },
        { status: 404 }
      );
    }

    // Get valid token
    const { accessToken, refreshed, newTokens } = await getValidAccessToken({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      expiresAt: connection.expiresAt,
    });

    if (refreshed && newTokens) {
      await prisma.stravaConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
        },
      });
    }

    // Fetch raw events - return EVERYTHING Strava sends (no type filtering)
    const events = await stravaApiFetch<Record<string, unknown>[]>(
      `/clubs/${connection.stravaClubId}/group_events`,
      accessToken
    );

    return NextResponse.json({
      clubId: connection.stravaClubId,
      clubName: connection.stravaClubName,
      eventCount: events.length,
      // Return complete raw event data to see ALL fields Strava returns
      rawEvents: events,
    });
  } catch (error) {
    console.error('GET /api/strava/debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
