import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/follows - Get user's follows
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const follows = await prisma.follow.findMany({
      where: { userId: session.user.id },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ follows });
  } catch (error) {
    console.error('GET /api/follows error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    );
  }
}

// POST /api/follows - Follow a brand or chapter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, chapterId } = body;

    if (!brandId && !chapterId) {
      return NextResponse.json(
        { error: 'brandId or chapterId is required' },
        { status: 400 }
      );
    }

    // Can't follow both at once
    if (brandId && chapterId) {
      return NextResponse.json(
        { error: 'Can only follow one entity at a time' },
        { status: 400 }
      );
    }

    // Verify the entity exists
    if (brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
      }
    }

    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }
    }

    // Create follow (upsert to handle duplicates gracefully)
    const follow = await prisma.follow.upsert({
      where: brandId
        ? { userId_brandId: { userId: session.user.id, brandId } }
        : { userId_chapterId: { userId: session.user.id, chapterId: chapterId! } },
      update: {},
      create: {
        userId: session.user.id,
        ...(brandId && { brandId }),
        ...(chapterId && { chapterId }),
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
            slug: true,
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(follow);
  } catch (error) {
    console.error('POST /api/follows error:', error);
    return NextResponse.json(
      { error: 'Failed to follow' },
      { status: 500 }
    );
  }
}

// DELETE /api/follows - Unfollow a brand or chapter
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const chapterId = searchParams.get('chapterId');
    const followId = searchParams.get('id');

    if (!brandId && !chapterId && !followId) {
      return NextResponse.json(
        { error: 'brandId, chapterId, or id is required' },
        { status: 400 }
      );
    }

    // Delete by follow ID
    if (followId) {
      await prisma.follow.deleteMany({
        where: {
          id: followId,
          userId: session.user.id,
        },
      });
    }
    // Delete by brandId
    else if (brandId) {
      await prisma.follow.deleteMany({
        where: {
          userId: session.user.id,
          brandId,
        },
      });
    }
    // Delete by chapterId
    else if (chapterId) {
      await prisma.follow.deleteMany({
        where: {
          userId: session.user.id,
          chapterId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/follows error:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow' },
      { status: 500 }
    );
  }
}
