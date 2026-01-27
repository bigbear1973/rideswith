import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Route,
  History,
  Instagram,
  Mail,
} from 'lucide-react';

const PACE_STYLES: Record<string, string> = {
  casual: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  moderate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  fast: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  race: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface PublicProfilePageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { slug },
    include: {
      rsvps: {
        where: { status: 'GOING' },
        include: {
          ride: {
            include: {
              organizer: {
                select: { id: true, name: true, slug: true },
              },
              _count: {
                select: { rsvps: { where: { status: 'GOING' } } },
              },
            },
          },
        },
        orderBy: { ride: { date: 'desc' } },
      },
      organizers: {
        include: {
          organizer: true,
        },
      },
      chapters: {
        include: {
          chapter: {
            include: {
              brand: {
                select: { name: true, slug: true, logo: true, logoIcon: true, primaryColor: true },
              },
              _count: {
                select: { rides: true, members: true },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const now = new Date();
  const upcomingRides = user.rsvps
    .filter((rsvp) => new Date(rsvp.ride.date) >= now)
    .sort((a, b) => new Date(a.ride.date).getTime() - new Date(b.ride.date).getTime())
    .slice(0, 5);
  const pastRides = user.rsvps
    .filter((rsvp) => new Date(rsvp.ride.date) < now)
    .slice(0, 10);

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user.email?.slice(0, 2).toUpperCase() || 'U';

  // Calculate stats
  const totalRides = user.rsvps.length;
  const totalDistance = pastRides.reduce((sum, rsvp) => sum + (rsvp.ride.distance || 0), 0);
  const communityCount = user.chapters.length;

  return (
    <div className="min-h-screen pb-8">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Avatar className="h-24 w-24">
                {user.image && <AvatarImage src={user.image} alt={user.name || ''} />}
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{user.name || 'Anonymous Rider'}</h1>
                {user.showEmail && user.email && (
                  <a
                    href={`mailto:${user.email}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {user.email}
                  </a>
                )}
                {user.bio && (
                  <p className="mt-2 text-muted-foreground">{user.bio}</p>
                )}
                {user.location && (
                  <p className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {user.location}
                  </p>
                )}
                {/* Social Links */}
                {(user.instagram || user.strava) && (
                  <div className="flex items-center gap-3 mt-3">
                    {user.instagram && (
                      <a
                        href={user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {user.strava && (
                      <a
                        href={user.strava.startsWith('http') ? user.strava : `https://strava.com/athletes/${user.strava}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{totalRides}</p>
                <p className="text-sm text-muted-foreground">Rides Joined</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(totalDistance)}</p>
                <p className="text-sm text-muted-foreground">km Ridden</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{communityCount}</p>
                <p className="text-sm text-muted-foreground">Communities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Rides */}
        {upcomingRides.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Rides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingRides.map((rsvp) => (
                  <Link key={rsvp.id} href={`/rides/${rsvp.ride.id}`}>
                    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center min-w-[60px] bg-primary/10 rounded-lg p-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(rsvp.ride.date), 'MMM')}
                        </span>
                        <span className="text-2xl font-bold">
                          {format(new Date(rsvp.ride.date), 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{rsvp.ride.title}</h3>
                        <p className="text-sm text-muted-foreground">{rsvp.ride.organizer.name}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(rsvp.ride.date), 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {rsvp.ride.locationName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className={PACE_STYLES[rsvp.ride.pace.toLowerCase()]}>
                            {rsvp.ride.pace.toLowerCase()}
                          </Badge>
                          {rsvp.ride.distance && (
                            <span className="text-xs text-muted-foreground">
                              {rsvp.ride.distance} km
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ride History */}
        {pastRides.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Rides
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastRides.map((rsvp) => (
                  <Link key={rsvp.id} href={`/rides/${rsvp.ride.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="text-sm text-muted-foreground min-w-[80px]">
                        {format(new Date(rsvp.ride.date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{rsvp.ride.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {rsvp.ride.organizer.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {rsvp.ride.distance && (
                          <span className="text-sm text-muted-foreground">
                            {rsvp.ride.distance} km
                          </span>
                        )}
                        <Badge variant="secondary" className={PACE_STYLES[rsvp.ride.pace.toLowerCase()]}>
                          {rsvp.ride.pace.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Communities */}
        {user.chapters.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Communities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.chapters.map((membership) => (
                  <Link
                    key={membership.id}
                    href={`/communities/${membership.chapter.brand?.slug}/${membership.chapter.slug}`}
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10">
                        {membership.chapter.brand?.logo && (
                          <AvatarImage
                            src={membership.chapter.brand.logoIcon || membership.chapter.brand.logo}
                            style={{ backgroundColor: membership.chapter.brand.primaryColor || undefined }}
                          />
                        )}
                        <AvatarFallback>
                          {membership.chapter.city.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {membership.chapter.brand?.name} {membership.chapter.city}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {membership.chapter._count.rides} rides · {membership.chapter._count.members} members
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state if no rides */}
        {totalRides === 0 && user.chapters.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No ride activity yet</p>
              <p className="text-sm mt-1">This rider hasn't joined any rides</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
