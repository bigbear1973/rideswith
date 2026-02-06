import HomeClient from './home-client';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

async function getLatestRides() {
  const now = new Date();
  const rides = await prisma.ride.findMany({
    where: {
      status: 'PUBLISHED',
      date: { gte: now },
      OR: [{ recurrenceSeriesId: null }, { isRecurringTemplate: true }],
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
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return rides.map((ride) => ({
    id: ride.id,
    title: ride.title,
    date: ride.date.toISOString(),
    locationName: ride.locationName,
    distance: ride.distance,
    pace: ride.pace.toLowerCase(),
    organizer: ride.organizer,
    attendeeCount: ride._count.rsvps,
    brand: ride.chapter?.brand
      ? {
          name: ride.chapter.brand.name,
          logo: ride.chapter.brand.logo,
          backdrop: ride.chapter.brand.backdrop,
          primaryColor: ride.chapter.brand.primaryColor,
        }
      : null,
  }));
}

export default async function HomePage() {
  const latestRides = await getLatestRides();
  return <HomeClient initialRides={latestRides} />;
}
