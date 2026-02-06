import DiscoverClient from './discover-client';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

async function getUpcomingRides() {
  const rides = await prisma.ride.findMany({
    where: {
      status: 'PUBLISHED',
      date: {
        gte: new Date(),
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
          rsvps: {
            where: { status: 'GOING' },
          },
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
    take: 50,
  });

  return rides.map((ride) => ({
    id: ride.id,
    title: ride.title,
    description: ride.description,
    date: ride.date.toISOString(),
    endTime: ride.endTime?.toISOString() ?? null,
    locationName: ride.locationName,
    locationAddress: ride.locationAddress,
    latitude: ride.latitude,
    longitude: ride.longitude,
    distance: ride.distance,
    elevation: ride.elevation,
    pace: ride.pace.toLowerCase(),
    terrain: ride.terrain,
    maxAttendees: ride.maxAttendees,
    isFree: ride.isFree,
    price: ride.price,
    routeUrl: ride.routeUrl,
    organizer: ride.organizer,
    brand: ride.chapter?.brand || null,
    attendeeCount: ride._count.rsvps,
  }));
}

export default async function DiscoverPage() {
  const initialRides = await getUpcomingRides();
  return <DiscoverClient initialRides={initialRides} />;
}
