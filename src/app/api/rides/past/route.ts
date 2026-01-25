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

    return NextResponse.json(rides);
  } catch (error) {
    console.error("Failed to fetch past rides:", error);
    return NextResponse.json(
      { error: "Failed to fetch past rides" },
      { status: 500 }
    );
  }
}
