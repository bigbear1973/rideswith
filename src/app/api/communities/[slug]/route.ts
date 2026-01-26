import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchBrandAssets, isValidDomain, cleanDomain } from "@/lib/brand-dev";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/communities/[slug] - Get a single brand
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    const brand = await prisma.brand.findUnique({
      where: { slug },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
          },
        },
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
    console.error("GET /api/communities/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

// PUT /api/communities/[slug] - Update brand (owner only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check ownership
    if (brand.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to edit this brand" },
        { status: 403 }
      );
    }

    // If refreshing from Brand.dev
    if (body.refreshBranding && brand.domain) {
      const brandAssets = await fetchBrandAssets(brand.domain);
      if (brandAssets) {
        const updatedBrand = await prisma.brand.update({
          where: { slug },
          data: {
            logo: brandAssets.logo || brand.logo,
            logoDark: brandAssets.logoDark || brand.logoDark,
            logoIcon: brandAssets.logoIcon || brand.logoIcon,
            primaryColor: brandAssets.primaryColor || brand.primaryColor,
            secondaryColor: brandAssets.secondaryColor || brand.secondaryColor,
            backdrop: brandAssets.backdrop || brand.backdrop,
            slogan: brandAssets.slogan || brand.slogan,
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
      updateData.domain = cleanDomain(body.domain);
    }

    // Type field
    const validTypes = ["BRAND", "CLUB", "GROUP"];
    if (body.type && validTypes.includes(body.type)) {
      updateData.type = body.type;
    }

    // Manual image uploads (Cloudinary URLs)
    if (body.logo !== undefined) updateData.logo = body.logo || null;
    if (body.backdrop !== undefined) updateData.backdrop = body.backdrop || null;
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor || null;

    // Social links (allow clearing by setting to empty string)
    if (body.instagram !== undefined) updateData.instagram = body.instagram || null;
    if (body.twitter !== undefined) updateData.twitter = body.twitter || null;
    if (body.facebook !== undefined) updateData.facebook = body.facebook || null;
    if (body.strava !== undefined) updateData.strava = body.strava || null;
    if (body.youtube !== undefined) updateData.youtube = body.youtube || null;

    const updatedBrand = await prisma.brand.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error("PUT /api/communities/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to update brand" },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[slug] - Delete brand (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    const brand = await prisma.brand.findUnique({
      where: { slug },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Check ownership
    if (brand.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this brand" },
        { status: 403 }
      );
    }

    await prisma.brand.delete({
      where: { slug },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/communities/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}
