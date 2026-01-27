import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/snippets - List user's snippets
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snippets = await prisma.rideSnippet.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { title: 'asc' },
      ],
    });

    return NextResponse.json({ snippets });
  } catch (error) {
    console.error('GET /api/snippets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippets' },
      { status: 500 }
    );
  }
}

// POST /api/snippets - Create a new snippet
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get the max sort order for this user to add new snippet at the end
    const maxOrder = await prisma.rideSnippet.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true },
    });

    const snippet = await prisma.rideSnippet.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        content: content.trim(),
        category: category?.trim() || null,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error('POST /api/snippets error:', error);
    return NextResponse.json(
      { error: 'Failed to create snippet' },
      { status: 500 }
    );
  }
}
