import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBrandAssets, isValidDomain } from "@/lib/brand-dev";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/brands/[slug] - Get a single brand
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        chapters: {
          include: {
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
            _count: {
              select: {
                rides: {
                  where: {
                    status: "PUBLISHED",
                    date: { gte: new Date() },
                  },
                },
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("GET /api/brands/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

// PUT /api/brands/[slug] - Update brand (refresh from Brand.dev)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const brand = await prisma.brand.findUnique({
      where: { slug },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // If refreshing from Brand.dev
    if (body.refreshBranding && brand.domain) {
      const brandAssets = await fetchBrandAssets(brand.domain);
      if (brandAssets) {
        const updatedBrand = await prisma.brand.update({
          where: { slug },
          data: {
            logo: brandAssets.logo || brand.logo,
            logoIcon: brandAssets.logoIcon || brand.logoIcon,
            primaryColor: brandAssets.primaryColor || brand.primaryColor,
            secondaryColor: brandAssets.secondaryColor || brand.secondaryColor,
            ...(brandAssets.fonts && { fonts: brandAssets.fonts }),
            description: brandAssets.description || brand.description,
          },
        });
        return NextResponse.json(updatedBrand);
      }
    }

    // Regular update
    const updateData: Record<string, unknown> = {};

    if (body.name) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.domain) {
      if (!isValidDomain(body.domain)) {
        return NextResponse.json(
          { error: "Invalid domain format" },
          { status: 400 }
        );
      }
      updateData.domain = body.domain;
    }

    const updatedBrand = await prisma.brand.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("PUT /api/brands/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}
