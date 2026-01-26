import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchBrandAssets } from "@/lib/brand-dev";

interface RouteParams {
  params: Promise<{ slug: string; chapter: string; id: string }>;
}

// GET /api/communities/[slug]/[chapter]/sponsors/[id] - Get a single sponsor
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, chapter: chapterSlug, id } = await params;

    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        brand: { slug },
      },
      select: { id: true },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor || sponsor.chapterId !== chapter.id) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error("GET /api/communities/[slug]/[chapter]/sponsors/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsor" },
      { status: 500 }
    );
  }
}

// PUT /api/communities/[slug]/[chapter]/sponsors/[id] - Update a sponsor
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, chapter: chapterSlug, id } = await params;
    const body = await request.json();

    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        brand: { slug },
      },
      include: {
        brand: true,
        members: {
          where: {
            userId: session.user.id,
            role: { in: ["OWNER", "ADMIN", "LEAD"] },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check permission
    const isBrandOwner = chapter.brand.createdById === session.user.id;
    const isChapterAdmin = chapter.members.length > 0;

    if (!isBrandOwner && !isChapterAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to edit sponsors" },
        { status: 403 }
      );
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor || sponsor.chapterId !== chapter.id) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    // If refreshing from Brand.dev
    if (body.refreshBranding && sponsor.domain) {
      const brandAssets = await fetchBrandAssets(sponsor.domain);
      if (brandAssets) {
        const updatedSponsor = await prisma.sponsor.update({
          where: { id },
          data: {
            logo: brandAssets.logo || sponsor.logo,
            primaryColor: brandAssets.primaryColor || sponsor.primaryColor,
          },
        });
        return NextResponse.json(updatedSponsor);
      }
    }

    // Regular update
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.domain !== undefined) updateData.domain = body.domain || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.website !== undefined) updateData.website = body.website;
    if (body.logo !== undefined) updateData.logo = body.logo || null;
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.displayOrder !== undefined) updateData.displayOrder = body.displayOrder;

    const updatedSponsor = await prisma.sponsor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedSponsor);
  } catch (error) {
    console.error("PUT /api/communities/[slug]/[chapter]/sponsors/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update sponsor" },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[slug]/[chapter]/sponsors/[id] - Delete a sponsor
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, chapter: chapterSlug, id } = await params;

    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        brand: { slug },
      },
      include: {
        brand: true,
        members: {
          where: {
            userId: session.user.id,
            role: { in: ["OWNER", "ADMIN", "LEAD"] },
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Check permission
    const isBrandOwner = chapter.brand.createdById === session.user.id;
    const isChapterAdmin = chapter.members.length > 0;

    if (!isBrandOwner && !isChapterAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete sponsors" },
        { status: 403 }
      );
    }

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
    });

    if (!sponsor || sponsor.chapterId !== chapter.id) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    await prisma.sponsor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/communities/[slug]/[chapter]/sponsors/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete sponsor" },
      { status: 500 }
    );
  }
}
