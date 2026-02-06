import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function createUniqueSlug(name: string) {
  const base = slugify(name) || 'organizer';
  let slug = base;
  let suffix = 0;

  while (true) {
    const existing = await prisma.organizer.findUnique({ where: { slug } });
    if (!existing) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    const [total, organizers] = await Promise.all([
      prisma.organizer.count({ where }),
      prisma.organizer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: organizers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/organizers error:', error);
    return NextResponse.json({ error: 'Failed to fetch organizers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = await createUniqueSlug(name);

    const organizer = await prisma.organizer.create({
      data: {
        name,
        slug,
        description: body.description || null,
        logoUrl: body.logoUrl || null,
        coverUrl: body.coverUrl || null,
        website: body.website || null,
        primaryColor: body.primaryColor || null,
        secondaryColor: body.secondaryColor || null,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
    });

    return NextResponse.json(organizer, { status: 201 });
  } catch (error) {
    console.error('POST /api/organizers error:', error);
    return NextResponse.json({ error: 'Failed to create organizer' }, { status: 500 });
  }
}
