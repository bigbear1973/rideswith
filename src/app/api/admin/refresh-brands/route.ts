import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchBrandAssets } from "@/lib/brand-dev";

// POST /api/admin/refresh-brands - Refresh all brands from Brand.dev
// Protected by secret token
export async function POST(request: NextRequest) {
  try {
    // Simple token protection - check for admin token
    const authHeader = request.headers.get("authorization");
    const adminToken = process.env.ADMIN_SECRET;

    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all brands with domains
    const brands = await prisma.brand.findMany({
      where: {
        domain: { not: null },
      },
    });

    const results = [];

    for (const brand of brands) {
      if (!brand.domain) continue;

      try {
        const brandAssets = await fetchBrandAssets(brand.domain);

        if (brandAssets) {
          await prisma.brand.update({
            where: { id: brand.id },
            data: {
              logo: brandAssets.logo || brand.logo,
              logoDark: brandAssets.logoDark || brand.logoDark,
              logoIcon: brandAssets.logoIcon || brand.logoIcon,
              primaryColor: brandAssets.primaryColor || brand.primaryColor,
              secondaryColor: brandAssets.secondaryColor || brand.secondaryColor,
              ...(brandAssets.fonts && { fonts: brandAssets.fonts }),
              description: brandAssets.description || brand.description,
            },
          });

          results.push({
            brand: brand.name,
            status: "updated",
            logo: brandAssets.logo,
            logoDark: brandAssets.logoDark,
          });
        } else {
          results.push({
            brand: brand.name,
            status: "no_assets_found",
          });
        }
      } catch (error) {
        results.push({
          brand: brand.name,
          status: "error",
          error: String(error),
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("POST /api/admin/refresh-brands error:", error);
    return NextResponse.json(
      { error: "Failed to refresh brands" },
      { status: 500 }
    );
  }
}
