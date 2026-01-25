import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/chapters - List chapters (optionally filtered by brand)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandSlug = searchParams.get("brand");

    const where: Record<string, unknown> = {};
    if (brandSlug) {
      where.brand = { slug: brandSlug };
    }

    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
          },
        },
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
      orderBy: [{ brand: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("GET /api/chapters error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

// POST /api/chapters - Create a new chapter
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { brandId, name, city } = body;

    // Validate required fields
    if (!brandId) {
      return NextResponse.json(
        { error: "Brand ID is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Chapter name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string" || city.trim().length < 2) {
      return NextResponse.json(
        { error: "City must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const brand = await prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Generate slug from city name
    const slug = city
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if chapter already exists for this brand
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        brandId_slug: {
          brandId,
          slug,
        },
      },
    });

    if (existingChapter) {
      return NextResponse.json(
        { error: "A chapter already exists for this city" },
        { status: 400 }
      );
    }

    // Create chapter with creator as LEAD
    const chapter = await prisma.chapter.create({
      data: {
        brandId,
        name: name.trim(),
        slug,
        city: city.trim(),
        memberCount: 1,
        members: {
          create: {
            userId,
            role: "LEAD",
          },
        },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            primaryColor: true,
          },
        },
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

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error("POST /api/chapters error:", error);
    return NextResponse.json(
      { error: "Failed to create chapter" },
      { status: 500 }
    );
  }
}
