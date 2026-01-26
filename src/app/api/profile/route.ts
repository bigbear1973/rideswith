import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        slug: true,
        bio: true,
        location: true,
        instagram: true,
        strava: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, bio, location, instagram, strava } = body;

    // Validate slug if provided
    if (slug) {
      // Check slug format
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return NextResponse.json(
          { error: 'Username can only contain lowercase letters, numbers, and hyphens' },
          { status: 400 }
        );
      }

      // Check slug length
      if (slug.length < 3 || slug.length > 30) {
        return NextResponse.json(
          { error: 'Username must be between 3 and 30 characters' },
          { status: 400 }
        );
      }

      // Check for reserved slugs
      const reservedSlugs = ['admin', 'api', 'auth', 'settings', 'profile', 'discover', 'create', 'organizers', 'rides'];
      if (reservedSlugs.includes(slug)) {
        return NextResponse.json(
          { error: 'This username is reserved' },
          { status: 400 }
        );
      }

      // Check if slug is taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: 'This username is already taken' },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name?.trim() || null,
        slug: slug?.trim() || null,
        bio: bio?.trim() || null,
        location: location?.trim() || null,
        instagram: instagram?.trim() || null,
        strava: strava?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        slug: true,
        bio: true,
        location: true,
        instagram: true,
        strava: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT /api/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
