import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForTokens } from '@/lib/strava';

/**
 * GET /api/strava/callback
 *
 * OAuth callback from Strava. Exchanges code for tokens and stores connection.
 * Then redirects to club selection page.
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.AUTH_URL || 'https://rideswith.com';

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=Unauthorized', baseUrl)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle Strava authorization errors
    if (error) {
      console.error('Strava authorization error:', error);
      const errorUrl = new URL('/api/strava/error', baseUrl);
      errorUrl.searchParams.set('error', error);
      return NextResponse.redirect(errorUrl);
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/api/strava/error?error=missing_params', baseUrl)
      );
    }

    // Decode and verify state
    let stateData: { chapterId: string; userId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/api/strava/error?error=invalid_state', baseUrl)
      );
    }

    // Verify the user matches
    if (stateData.userId !== session.user.id) {
      return NextResponse.redirect(
        new URL('/api/strava/error?error=user_mismatch', baseUrl)
      );
    }

    // Verify state is not too old (max 10 minutes)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      return NextResponse.redirect(
        new URL('/api/strava/error?error=state_expired', baseUrl)
      );
    }

    // Get chapter info for redirect
    const chapter = await prisma.chapter.findUnique({
      where: { id: stateData.chapterId },
      include: {
        brand: { select: { slug: true } },
      },
    });

    if (!chapter) {
      return NextResponse.redirect(
        new URL('/api/strava/error?error=chapter_not_found', baseUrl)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Store tokens temporarily in session storage
    // We'll complete the connection after club selection
    // For now, store in a temporary record without club info
    await prisma.stravaConnection.upsert({
      where: { chapterId: stateData.chapterId },
      create: {
        userId: session.user.id,
        chapterId: stateData.chapterId,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        stravaClubId: '', // Will be set after club selection
        stravaClubName: null,
      },
      update: {
        userId: session.user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
        stravaClubId: '', // Reset for new selection
        stravaClubName: null,
      },
    });

    // Redirect to chapter edit page with a flag to show club selection
    const redirectUrl = new URL(
      `/communities/${chapter.brand.slug}/${chapter.slug}/edit`,
      baseUrl
    );
    redirectUrl.searchParams.set('stravaConnected', 'true');
    redirectUrl.searchParams.set('selectClub', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('GET /api/strava/callback error:', error);
    const baseUrl = process.env.AUTH_URL || 'https://rideswith.com';
    return NextResponse.redirect(
      new URL('/api/strava/error?error=callback_failed', baseUrl)
    );
  }
}
