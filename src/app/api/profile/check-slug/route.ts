import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ available: false, valid: false });
    }

    // Check slug format
    const valid = /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 30;

    if (!valid) {
      return NextResponse.json({ available: false, valid: false });
    }

    // Check for reserved slugs
    const reservedSlugs = ['admin', 'api', 'auth', 'settings', 'profile', 'discover', 'create', 'organizers', 'rides'];
    if (reservedSlugs.includes(slug)) {
      return NextResponse.json({ available: false, valid: true });
    }

    // Check if slug is taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    });

    const available = !existingUser || existingUser.id === session.user.id;

    return NextResponse.json({ available, valid: true });
  } catch (error) {
    console.error('GET /api/profile/check-slug error:', error);
    return NextResponse.json({ error: 'Failed to check slug' }, { status: 500 });
  }
}
