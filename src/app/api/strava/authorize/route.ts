import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStravaAuthorizationUrl } from '@/lib/strava';
import { isAdmin } from '@/lib/roles';

/**
 * GET /api/strava/authorize
 *
 * Start the Strava OAuth flow for a chapter.
 * Requires user to be an admin of the chapter.
 *
 * Query params:
 *   - chapterId: The chapter to connect Strava to
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
        { error: 'Only chapter admins can connect Strava' },
        { status: 403 }
      );
    }

    // Check if Strava is already connected
    const existingConnection = await prisma.stravaConnection.findUnique({
      where: { chapterId },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: 'Strava is already connected. Disconnect first to reconnect.' },
        { status: 400 }
      );
    }

    // Create state parameter with chapter info (will be verified in callback)
    const state = Buffer.from(
      JSON.stringify({
        chapterId,
        userId: session.user.id,
        timestamp: Date.now(),
      })
    ).toString('base64url');

    // Redirect to Strava authorization
    const authUrl = getStravaAuthorizationUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('GET /api/strava/authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to start Strava authorization' },
      { status: 500 }
    );
  }
}
