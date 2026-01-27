import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/snippets/[id] - Get a specific snippet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const snippet = await prisma.rideSnippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    // Only owner can view their snippets
    if (snippet.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(snippet);
  } catch (error) {
    console.error('GET /api/snippets/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snippet' },
      { status: 500 }
    );
  }
}

// PUT /api/snippets/[id] - Update a snippet
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, content, category, sortOrder } = body;

    // Find and verify ownership
    const existing = await prisma.rideSnippet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
      return NextResponse.json({ error: 'Content cannot be empty' }, { status: 400 });
    }

    const snippet = await prisma.rideSnippet.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content: content.trim() }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(snippet);
  } catch (error) {
    console.error('PUT /api/snippets/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to update snippet' },
      { status: 500 }
    );
  }
}

// DELETE /api/snippets/[id] - Delete a snippet
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find and verify ownership
    const existing = await prisma.rideSnippet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.rideSnippet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/snippets/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete snippet' },
      { status: 500 }
    );
  }
}
