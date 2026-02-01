import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAthleteClubs, getValidAccessToken } from '@/lib/strava';
import { syncStravaEvents } from '@/lib/strava-sync';
import { isAdmin } from '@/lib/roles';

/**
 * GET /api/strava/clubs
 *
 * Get list of Strava clubs the user is a member of.
 * Requires an existing Strava connection (after OAuth).
 *
 * Query params:
 *   - chapterId: The chapter with the Strava connection
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
        { error: 'Only chapter admins can access Strava' },
        { status: 403 }
      );
    }

    // Get the Strava connection
    const connection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No Strava connection found. Please connect Strava first.' },
        { status: 404 }
      );
    }

    // Get a valid access token
    const { accessToken, refreshed, newTokens } = await getValidAccessToken({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
      expiresAt: connection.expiresAt,
    });

    // Update tokens if refreshed
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

    // Fetch clubs from Strava
    const clubs = await getAthleteClubs(accessToken);

    // Return clubs with relevant info
    return NextResponse.json({
      clubs: clubs.map((club) => ({
        id: String(club.id),
        name: club.name,
        profileMedium: club.profile_medium,
        coverPhoto: club.cover_photo,
        city: club.city,
        state: club.state,
        country: club.country,
        memberCount: club.member_count,
        isAdmin: club.admin,
      })),
      currentClubId: connection.stravaClubId || null,
    });
  } catch (error) {
    console.error('GET /api/strava/clubs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Strava clubs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/strava/clubs
 *
 * Select a club to sync events from.
 *
 * Body:
 *   - chapterId: The chapter with the Strava connection
 *   - clubId: The Strava club ID to sync
 *   - clubName: The club name for display
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chapterId, clubId, clubName } = body;

    if (!chapterId || !clubId) {
      return NextResponse.json(
        { error: 'chapterId and clubId are required' },
        { status: 400 }
      );
    }

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
        { error: 'Only chapter admins can select Strava club' },
        { status: 403 }
      );
    }

    // Get the Strava connection
    const connection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'No Strava connection found. Please connect Strava first.' },
        { status: 404 }
      );
    }

    // Update the connection with selected club
    await prisma.stravaConnection.update({
      where: { id: connection.id },
      data: {
        stravaClubId: clubId,
        stravaClubName: clubName || null,
      },
    });

    // Run initial sync immediately
    const syncResult = await syncStravaEvents(chapterId);

    return NextResponse.json({
      success: true,
      clubId,
      clubName,
      syncResult,
    });
  } catch (error) {
    console.error('POST /api/strava/clubs error:', error);
    return NextResponse.json(
      { error: 'Failed to select Strava club' },
      { status: 500 }
    );
  }
}
