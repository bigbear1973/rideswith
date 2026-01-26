import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/platform-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/communities/[id] - Update community admin settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!isPlatformAdmin(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const community = await prisma.brand.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Build update data - only allow specific admin fields
    const updateData: Record<string, unknown> = {};

    if (typeof body.sponsorsEnabled === "boolean") {
      updateData.sponsorsEnabled = body.sponsorsEnabled;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedCommunity = await prisma.brand.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        sponsorsEnabled: true,
      },
    });

    return NextResponse.json(updatedCommunity);
  } catch (error) {
    console.error("PATCH /api/admin/communities/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update community" },
      { status: 500 }
    );
  }
}
