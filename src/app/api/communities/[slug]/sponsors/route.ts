import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchBrandAssets } from "@/lib/brand-dev";
import { canManageSponsors, isPlatformAdmin } from "@/lib/platform-admin";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/communities/[slug]/sponsors - List sponsors for a community
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    const brand = await prisma.brand.findUnique({
      where: { slug },
      select: { id: true, sponsorLabel: true, sponsorsEnabled: true },
    });

    if (!brand) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // If sponsors aren't enabled, return empty list (unless admin)
    const session = await auth();
    if (!brand.sponsorsEnabled && !isPlatformAdmin(session)) {
      return NextResponse.json({
        sponsors: [],
        sponsorLabel: brand.sponsorLabel || "sponsors",
        sponsorsEnabled: false,
      });
    }

    const sponsors = await prisma.sponsor.findMany({
      where: {
        brandId: brand.id,
        ...(showAll ? {} : { isActive: true }),
      },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json({
      sponsors,
      sponsorLabel: brand.sponsorLabel || "sponsors",
      sponsorsEnabled: brand.sponsorsEnabled,
    });
  } catch (error) {
    console.error("GET /api/communities/[slug]/sponsors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsors" },
      { status: 500 }
    );
  }
}

// POST /api/communities/[slug]/sponsors - Create a new sponsor
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();

    const brand = await prisma.brand.findUnique({
      where: { slug },
    });

    if (!brand) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if sponsors are enabled for this community
    if (!canManageSponsors(session, brand.sponsorsEnabled)) {
      return NextResponse.json(
        { error: "Sponsors are not enabled for this community. Contact the platform administrator." },
        { status: 403 }
      );
    }

    // Check ownership (platform admins can always manage)
    if (brand.createdById !== session.user.id && !isPlatformAdmin(session)) {
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
      where: { brandId: brand.id },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const nextOrder = (lastSponsor?.displayOrder ?? -1) + 1;

    const sponsor = await prisma.sponsor.create({
      data: {
        brandId: brand.id,
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
    console.error("POST /api/communities/[slug]/sponsors error:", error);
    return NextResponse.json(
      { error: "Failed to create sponsor" },
      { status: 500 }
    );
  }
}
