import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chapters/[id] - Get a single chapter with rides
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        brand: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        },
        rides: {
          where: {
            status: "PUBLISHED",
            date: { gte: new Date() },
          },
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                rsvps: {
                  where: { status: "GOING" },
                },
              },
            },
          },
          orderBy: {
            date: "asc",
          },
          take: 10,
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("GET /api/chapters/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}

// PUT /api/chapters/[id] - Update chapter (Lead only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if user is a Lead of this chapter
    const membership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId,
        },
      },
    });

    if (!membership || membership.role !== "LEAD") {
      return NextResponse.json(
        { error: "Only chapter leads can update chapter settings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name) updateData.name = body.name;
    if (body.city) updateData.city = body.city;
    if (body.customLogo !== undefined) updateData.customLogo = body.customLogo;
    if (body.customColors !== undefined)
      updateData.customColors = body.customColors;

    const chapter = await prisma.chapter.update({
      where: { id },
      data: updateData,
      include: {
        brand: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("PUT /api/chapters/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update chapter" },
      { status: 500 }
    );
  }
}

// POST /api/chapters/[id]/members - Add a member (invite)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const body = await request.json();
    const { userId, role = "AMBASSADOR" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if current user is a Lead
    const currentMembership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId: currentUserId,
        },
      },
    });

    if (!currentMembership || currentMembership.role !== "LEAD") {
      return NextResponse.json(
        { error: "Only chapter leads can add members" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this chapter" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["LEAD", "AMBASSADOR"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Add member
    const member = await prisma.chapterMember.create({
      data: {
        chapterId: id,
        userId,
        role: role as ChapterRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
          },
        },
      },
    });

    // Update member count
    await prisma.chapter.update({
      where: { id },
      data: { memberCount: { increment: 1 } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("POST /api/chapters/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
