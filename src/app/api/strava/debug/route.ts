import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getClubEvents, getValidAccessToken } from '@/lib/strava';
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

    // Fetch raw events
    const events = await getClubEvents(connection.stravaClubId, accessToken);

    return NextResponse.json({
      clubId: connection.stravaClubId,
      clubName: connection.stravaClubName,
      eventCount: events.length,
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description?.substring(0, 100),
        address: e.address,
        start_latlng: e.start_latlng,
        start_date_local: e.start_date_local,
        created_at: e.created_at,
        upcoming_occurrences: e.upcoming_occurrences,
        activity_type: e.activity_type,
        private: e.private,
        skill_level: e.skill_level,
      })),
    });
  } catch (error) {
    console.error('GET /api/strava/debug error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
