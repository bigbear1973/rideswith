import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Organizer Profile | RidesWith',
  robots: {
    index: false,
    follow: false,
  },
};

interface OrganizerPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { id } = await params;

  if (!id) notFound();

  const organizer = await prisma.organizer.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              slug: true,
            },
          },
        },
        orderBy: { role: 'asc' },
      },
      rides: {
        where: {
          status: 'PUBLISHED',
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 10,
      },
    },
  });

  if (!organizer) notFound();

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 md:px-[60px] py-12 md:py-16">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{organizer.name}</h1>
          {organizer.website && (
            <a
              href={organizer.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground underline"
            >
              {organizer.website}
            </a>
          )}
          {organizer.description && (
            <p className="text-muted-foreground mt-4">{organizer.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-10">
          <div>
            <span className="block text-foreground font-semibold">{organizer.memberCount}</span>
            Members
          </div>
          <div>
            <span className="block text-foreground font-semibold">{organizer.rideCount}</span>
            Total rides
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming rides</h2>
          {organizer.rides.length === 0 ? (
            <p className="text-muted-foreground">No upcoming rides scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {organizer.rides.map((ride) => (
                <li key={ride.id}>
                  <Link href={`/rides/${ride.id}`} className="underline">
                    {ride.title}
                  </Link>
                  <span className="text-xs text-muted-foreground ml-2">
                    {format(ride.date, 'MMM d, yyyy')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
