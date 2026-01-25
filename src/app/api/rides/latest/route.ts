import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        status: 'PUBLISHED',
        date: {
          gte: new Date(), // Only future rides
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        chapter: {
          select: {
            id: true,
            name: true,
            brand: {
              select: {
                name: true,
                logo: true,
                backdrop: true,
                primaryColor: true,
              },
            },
          },
        },
        _count: {
          select: {
            rsvps: {
              where: { status: 'GOING' },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recently added
      },
      take: 3,
    });

    const response = rides.map((ride) => ({
      id: ride.id,
      title: ride.title,
      date: ride.date,
      locationName: ride.locationName,
      distance: ride.distance,
      pace: ride.pace.toLowerCase(),
      organizer: ride.organizer,
      attendeeCount: ride._count.rsvps,
      // Include brand info if this is a branded ride
      brand: ride.chapter?.brand ? {
        name: ride.chapter.brand.name,
        logo: ride.chapter.brand.logo,
        backdrop: ride.chapter.brand.backdrop,
        primaryColor: ride.chapter.brand.primaryColor,
      } : null,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/rides/latest error:', error);
    return NextResponse.json({ error: 'Failed to fetch latest rides' }, { status: 500 });
  }
}
