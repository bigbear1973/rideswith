import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchBrandAssets,
  isValidDomain,
  generateBrandSlug,
  cleanDomain,
} from "@/lib/brand-dev";

// GET /api/brands - List all brands
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        chapters: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            memberCount: true,
            rideCount: true,
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, domain, type } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Brand name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Validate domain if provided
    if (domain && !isValidDomain(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    // Generate slug
    let slug = generateBrandSlug(name.trim());

    // Check if slug already exists
    const existingBrand = await prisma.brand.findUnique({
      where: { slug },
    });

    if (existingBrand) {
      // Append random suffix if slug exists
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Fetch brand assets from Brand.dev if domain provided
    let brandAssets = null;
    if (domain) {
      brandAssets = await fetchBrandAssets(domain);
    }

    // Validate type if provided
    const validTypes = ["BRAND", "CLUB", "GROUP"];
    const communityType = type && validTypes.includes(type) ? type : "BRAND";

    // Create the brand
    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        slug,
        type: communityType,
        domain: domain ? cleanDomain(domain) : null,
        description: brandAssets?.description || null,
        logo: brandAssets?.logo || null,
        logoDark: brandAssets?.logoDark || null,
        logoIcon: brandAssets?.logoIcon || null,
        primaryColor: brandAssets?.primaryColor || null,
        secondaryColor: brandAssets?.secondaryColor || null,
        backdrop: brandAssets?.backdrop || null,
        slogan: brandAssets?.slogan || null,
        ...(brandAssets?.fonts && { fonts: brandAssets.fonts }),
        createdById: session.user.id,
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error("POST /api/brands error:", error);
    return NextResponse.json(
      { error: "Failed to create brand" },
      { status: 500 }
    );
  }
}
