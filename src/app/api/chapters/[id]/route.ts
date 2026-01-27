import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChapterRole } from "@prisma/client";
import { isOwner, isAdmin, normalizeRole } from "@/lib/roles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chapters/[id] - Get a single chapter with rides
// Query params:
//   - includePastRides=true - Include past rides in response
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includePastRides = searchParams.get("includePastRides") === "true";

    const now = new Date();

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
            date: { gte: now },
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

    // Fetch past rides separately if requested
    let pastRides: typeof chapter.rides = [];
    if (includePastRides) {
      pastRides = await prisma.ride.findMany({
        where: {
          chapterId: id,
          status: "PUBLISHED",
          date: { lt: now },
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
          date: "desc",
        },
        take: 20,
      });
    }

    return NextResponse.json({
      ...chapter,
      pastRides,
    });

  } catch (error) {
    console.error("GET /api/chapters/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}

// PUT /api/chapters/[id] - Update chapter (Owner or Admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if user is Owner or Admin of this chapter
    const membership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId,
        },
      },
    });

    if (!membership || !isAdmin(membership.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can update chapter settings" },
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
    if (body.sponsorLabel !== undefined) updateData.sponsorLabel = body.sponsorLabel;
    if (body.hidePresentedBy !== undefined) updateData.hidePresentedBy = body.hidePresentedBy;
    if (body.sponsorsEnabled !== undefined) updateData.sponsorsEnabled = body.sponsorsEnabled;
    // Chat links
    if (body.telegram !== undefined) updateData.telegram = body.telegram;
    if (body.whatsapp !== undefined) updateData.whatsapp = body.whatsapp;
    if (body.discord !== undefined) updateData.discord = body.discord;
    if (body.signal !== undefined) updateData.signal = body.signal;
    // Website/domain
    if (body.domain !== undefined) updateData.domain = body.domain;
    // Social links
    if (body.inheritSocialLinks !== undefined) updateData.inheritSocialLinks = body.inheritSocialLinks;
    if (body.instagram !== undefined) updateData.instagram = body.instagram;
    if (body.twitter !== undefined) updateData.twitter = body.twitter;
    if (body.facebook !== undefined) updateData.facebook = body.facebook;
    if (body.strava !== undefined) updateData.strava = body.strava;
    if (body.youtube !== undefined) updateData.youtube = body.youtube;

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
    const { userId, role = "MODERATOR" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if current user is Owner or Admin
    const currentMembership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId: currentUserId,
        },
      },
    });

    if (!currentMembership || !isAdmin(currentMembership.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can add members" },
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

    // Validate role - Admins can only add Moderators, Owners can add anyone
    const validRoles = ["OWNER", "ADMIN", "MODERATOR"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Admins cannot promote to Owner or Admin (only Owners can)
    if (!isOwner(currentMembership.role) && ["OWNER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Admins can only add moderators" },
        { status: 403 }
      );
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

// DELETE /api/chapters/[id] - Remove a member OR delete the chapter
// Query params:
//   - userId: Remove a specific member
//   - deleteChapter=true: Delete the entire chapter (Owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");
    const deleteChapter = searchParams.get("deleteChapter") === "true";

    // Handle chapter deletion
    if (deleteChapter) {
      // Check if user is Owner of this chapter or Brand owner
      const chapter = await prisma.chapter.findUnique({
        where: { id },
        include: {
          brand: { select: { createdById: true } },
          members: { where: { userId: currentUserId } },
        },
      });

      if (!chapter) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }

      const isBrandOwner = chapter.brand.createdById === currentUserId;
      const isChapterOwner = chapter.members.some(m => isOwner(m.role));

      if (!isBrandOwner && !isChapterOwner) {
        return NextResponse.json(
          { error: "Only chapter owners or community owners can delete a chapter" },
          { status: 403 }
        );
      }

      // Check if chapter has any rides
      const rideCount = await prisma.ride.count({
        where: { chapterId: id },
      });

      if (rideCount > 0) {
        return NextResponse.json(
          { error: `Cannot delete chapter with ${rideCount} ride(s). Remove all rides first.` },
          { status: 400 }
        );
      }

      // Delete all chapter members first
      await prisma.chapterMember.deleteMany({
        where: { chapterId: id },
      });

      // Delete all chapter sponsors
      await prisma.sponsor.deleteMany({
        where: { chapterId: id },
      });

      // Delete the chapter
      await prisma.chapter.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, deleted: true });
    }

    // Handle member removal (existing logic)
    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if current user is Owner or Admin
    const currentMembership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId: currentUserId,
        },
      },
    });

    // Users can remove themselves
    const isSelfRemoval = currentUserId === targetUserId;

    if (!isSelfRemoval && (!currentMembership || !isAdmin(currentMembership.role))) {
      return NextResponse.json(
        { error: "Only owners and admins can remove members" },
        { status: 403 }
      );
    }

    // Get target membership
    const targetMembership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Cannot remove the last Owner (includes legacy LEAD role)
    if (isOwner(targetMembership.role)) {
      const ownerCount = await prisma.chapterMember.count({
        where: {
          chapterId: id,
          role: { in: ["OWNER", "LEAD"] },
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner. Transfer ownership first." },
          { status: 400 }
        );
      }
    }

    // Admins cannot remove Owners or other Admins
    if (currentMembership && !isOwner(currentMembership.role) && isAdmin(targetMembership.role)) {
      return NextResponse.json(
        { error: "Admins can only remove moderators" },
        { status: 403 }
      );
    }

    // Remove member
    await prisma.chapterMember.delete({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId: targetUserId,
        },
      },
    });

    // Update member count
    await prisma.chapter.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/chapters/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// PATCH /api/chapters/[id]/members - Update a member's role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUserId = session.user.id;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["OWNER", "ADMIN", "MODERATOR"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if current user is Owner or Admin
    const currentMembership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId: currentUserId,
        },
      },
    });

    if (!currentMembership || !isAdmin(currentMembership.role)) {
      return NextResponse.json(
        { error: "Only owners and admins can update roles" },
        { status: 403 }
      );
    }

    // Get target membership
    const targetMembership = await prisma.chapterMember.findUnique({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Only owners can promote to Admin or Owner
    if (!isOwner(currentMembership.role) && ["OWNER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Only owners can promote to admin or owner" },
        { status: 403 }
      );
    }

    // Cannot demote the last Owner (includes legacy LEAD role)
    if (isOwner(targetMembership.role) && role !== "OWNER") {
      const ownerCount = await prisma.chapterMember.count({
        where: {
          chapterId: id,
          role: { in: ["OWNER", "LEAD"] },
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last owner" },
          { status: 400 }
        );
      }
    }

    // Update role
    const member = await prisma.chapterMember.update({
      where: {
        chapterId_userId: {
          chapterId: id,
          userId,
        },
      },
      data: { role: role as ChapterRole },
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

    return NextResponse.json(member);
  } catch (error) {
    console.error("PATCH /api/chapters/[id]/members error:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
