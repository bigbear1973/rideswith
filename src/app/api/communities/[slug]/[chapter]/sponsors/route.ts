import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchBrandAssets } from "@/lib/brand-dev";
import { canManageSponsors, isPlatformAdmin } from "@/lib/platform-admin";

interface RouteParams {
  params: Promise<{ slug: string; chapter: string }>;
}

// GET /api/communities/[slug]/[chapter]/sponsors - List sponsors for a chapter
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug, chapter: chapterSlug } = await params;
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        slug: chapterSlug,
        brand: { slug },
      },
      select: {
        id: true,
        sponsorLabel: true,
        brand: {
          select: {
            id: true,
            sponsorLabel: true,
            sponsorsEnabled: true,
          },
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // If sponsors aren't enabled at brand level, return empty list (unless admin)
    const session = await auth();
    if (!chapter.brand.sponsorsEnabled && !isPlatformAdmin(session)) {
      return NextResponse.json({
        sponsors: [],
        sponsorLabel: chapter.sponsorLabel || chapter.brand.sponsorLabel || "sponsors",
        sponsorsEnabled: false,
      });
    }

    // Get chapter-specific sponsors only (chapters don't inherit brand sponsors)
    const sponsors = await prisma.sponsor.findMany({
      where: {
        chapterId: chapter.id,
        ...(showAll ? {} : { isActive: true }),
      },
      orderBy: { displayOrder: "asc" },
    });

    // Use chapter's label if set, otherwise inherit from brand
    const sponsorLabel = chapter.sponsorLabel || chapter.brand.sponsorLabel || "sponsors";

    return NextResponse.json({
      sponsors,
      sponsorLabel,
      sponsorsEnabled: chapter.brand.sponsorsEnabled,
    });
  } catch (error) {
    console.error("GET /api/communities/[slug]/[chapter]/sponsors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsors" },
      { status: 500 }
    );
  }
}

// POST /api/communities/[slug]/[chapter]/sponsors - Create a chapter sponsor
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, chapter: chapterSlug } = await params;
    const body = await request.json();

    // Find the chapter
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

    // Check if sponsors are enabled for this community
    if (!canManageSponsors(session, chapter.brand.sponsorsEnabled)) {
      return NextResponse.json(
        { error: "Sponsors are not enabled for this community. Contact the platform administrator." },
        { status: 403 }
      );
    }

    // Check permission: must be brand owner, chapter admin, or platform admin
    const isBrandOwner = chapter.brand.createdById === session.user.id;
    const isChapterAdmin = chapter.members.length > 0;

    if (!isBrandOwner && !isChapterAdmin && !isPlatformAdmin(session)) {
      return NextResponse.json(
        { error: "You don't have permission to add sponsors" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length < 1) {
      return NextResponse.json(
        { error: "Sponsor name is required" },
        { status: 400 }
      );
    }

    if (!body.website || typeof body.website !== "string") {
      return NextResponse.json(
        { error: "Website URL is required" },
        { status: 400 }
      );
    }

    // Fetch Brand.dev assets if domain provided
    let brandAssets = null;
    if (body.domain) {
      brandAssets = await fetchBrandAssets(body.domain);
    }

    // Get next display order
    const lastSponsor = await prisma.sponsor.findFirst({
      where: { chapterId: chapter.id },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const nextOrder = (lastSponsor?.displayOrder ?? -1) + 1;

    const sponsor = await prisma.sponsor.create({
      data: {
        chapterId: chapter.id,
        name: body.name.trim(),
        domain: body.domain || null,
        description: body.description || null,
        website: body.website,
        logo: body.logo || brandAssets?.logo || null,
        backdrop: body.backdrop || null,
        primaryColor: body.primaryColor || brandAssets?.primaryColor || null,
        displaySize: body.displaySize || 'SMALL',
        isActive: body.isActive !== false,
        displayOrder: body.displayOrder ?? nextOrder,
      },
    });

    return NextResponse.json(sponsor, { status: 201 });
  } catch (error) {
    console.error("POST /api/communities/[slug]/[chapter]/sponsors error:", error);
    return NextResponse.json(
      { error: "Failed to create sponsor" },
      { status: 500 }
    );
  }
}
