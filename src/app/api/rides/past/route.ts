import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        date: {
          lt: new Date(), // Only past rides
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        chapter: {
          select: {
            id: true,
            city: true,
            slug: true,
            brand: {
              select: {
                name: true,
                slug: true,
                logo: true,
                logoIcon: true,
                primaryColor: true,
              },
            },
          },
        },
        _count: {
          select: {
            rsvps: true,
          },
        },
      },
      orderBy: {
        date: "desc", // Most recent past rides first
      },
      take: 100, // Limit to prevent huge responses
    });

    // Transform to match the discover page format
    const transformedRides = rides.map((ride) => ({
      ...ride,
      brand: ride.chapter?.brand || null,
    }));

    return NextResponse.json(transformedRides);
  } catch (error) {
    console.error("Failed to fetch past rides:", error);
    return NextResponse.json(
      { error: "Failed to fetch past rides" },
      { status: 500 }
    );
  }
}
