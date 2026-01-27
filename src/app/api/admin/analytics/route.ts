import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/platform-admin";

// GET /api/admin/analytics - Get platform analytics
export async function GET() {
  try {
    const session = await auth();

    if (!isPlatformAdmin(session)) {
      return NextResponse.json(
        { error: "You do not have permission to access this resource" },
        { status: 403 }
      );
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run all queries in parallel
    const [
      totalUsers,
      newUsers7d,
      newUsers30d,
      totalCommunities,
      totalChapters,
      totalRides,
      upcomingRides,
      pastRides,
      totalRsvps,
      recentUsers,
      topCommunities,
      ridesByMonth,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // New users in last 7 days
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),

      // New users in last 30 days
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Total communities
      prisma.brand.count(),

      // Total chapters
      prisma.chapter.count(),

      // Total rides
      prisma.ride.count(),

      // Upcoming rides
      prisma.ride.count({
        where: { date: { gte: now } },
      }),

      // Past rides
      prisma.ride.count({
        where: { date: { lt: now } },
      }),

      // Total RSVPs
      prisma.rsvp.count(),

      // Recent user signups (last 50)
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              rsvps: true,
              chapters: true,
            },
          },
        },
      }),

      // Top communities by ride count
      prisma.brand.findMany({
        orderBy: {
          chapters: {
            _count: "desc",
          },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          _count: {
            select: {
              chapters: true,
            },
          },
          chapters: {
            select: {
              rideCount: true,
            },
          },
        },
      }),

      // Rides created by month (last 6 months)
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
          COUNT(*) as count
        FROM "Ride"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,
    ]);

    // Process top communities to include total ride count
    const processedCommunities = topCommunities.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      logo: c.logo,
      chapterCount: c._count.chapters,
      rideCount: c.chapters.reduce((sum, ch) => sum + ch.rideCount, 0),
    }));

    // Sort by ride count
    processedCommunities.sort((a, b) => b.rideCount - a.rideCount);

    // Convert bigint to number for rides by month
    const ridesByMonthProcessed = ridesByMonth.map((r) => ({
      month: r.month,
      count: Number(r.count),
    }));

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsers7d,
        newUsers30d,
        totalCommunities,
        totalChapters,
        totalRides,
        upcomingRides,
        pastRides,
        totalRsvps,
      },
      recentUsers,
      topCommunities: processedCommunities,
      ridesByMonth: ridesByMonthProcessed,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
