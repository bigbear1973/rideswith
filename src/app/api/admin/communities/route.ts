import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/platform-admin";

// GET /api/admin/communities - List all communities for admin
export async function GET() {
  try {
    const session = await auth();

    if (!isPlatformAdmin(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    const communities = await prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        logo: true,
        sponsorsEnabled: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    });

    return NextResponse.json({ communities });
  } catch (error) {
    console.error("GET /api/admin/communities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch communities" },
      { status: 500 }
    );
  }
}
