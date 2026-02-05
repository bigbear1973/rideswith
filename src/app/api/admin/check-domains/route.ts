import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/platform-admin";

// GET /api/admin/check-domains - List brands with potentially malformed domains
export async function GET() {
  try {
    const session = await auth();
    if (!isPlatformAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const brands = await prisma.brand.findMany({
      where: {
        domain: { not: null }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
      },
      orderBy: { name: "asc" }
    });

    // Check for malformed domains
    const issues = brands.filter(brand => {
      if (!brand.domain) return false;
      // Check for double protocol, www, or other issues
      return (
        brand.domain.includes('://') ||
        brand.domain.includes('//') ||
        brand.domain.startsWith('www.')
      );
    });

    return NextResponse.json({
      total: brands.length,
      issueCount: issues.length,
      issues: issues.map(b => ({
        name: b.name,
        slug: b.slug,
        domain: b.domain,
        editUrl: `/communities/${b.slug}/edit`
      })),
      allBrands: brands.map(b => ({
        name: b.name,
        slug: b.slug,
        domain: b.domain,
      }))
    });
  } catch (error) {
    console.error("GET /api/admin/check-domains error:", error);
    return NextResponse.json(
      { error: "Failed to check domains" },
      { status: 500 }
    );
  }
}
